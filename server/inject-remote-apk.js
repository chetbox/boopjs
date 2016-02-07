var shortid = require('shortid');
var Promise = require('bluebird');
Promise.config({ longStackTraces: true });
var request = Promise.promisifyAll(require('request'));
var Queue = require('bull');
var config = require('config');
var cluster = require('cluster');
var _ = require('underscore');

var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''));

require('coffee-script/register');
var tmp = require('./tmp');
var s3 = require('./model/third-party/s3');
var email = require('./reporting/email');
var appetizeio = require('./apps/appetizeio');
var db = require('./db');
var test_runner = require('./test_runner');
var get_apk_info = require('./apps/android/info');
var inject_chetbot = require('./apps/android/inject-chetbot');
var model = {
  users: require('./model/users'),
  apps: require('./model/apps')
}

var queue = Queue('inject-remote-apk', config.redis.port, config.redis.host);

exports.add_public_url_to_queue = function(user_id, app_id, url, options) {
  debug('add_public_url_to_queue', user_id, app_id, url);
  if (!user_id) throw new Error('user_id required');
  if (!app_id) throw new Error('app_id required');
  if (!url) throw new Error('url required');
  options = options || {};

  return model.apps.set_processing_status(app_id, 'Pending')
  .then(function() {
    queue.add({
      user_id: user_id,
      app_id: app_id,
      public_url: url,
      run_tests: !!options.run_tests
    });
  });
}

exports.add_s3_file_to_queue = function(user_id, app_id, s3_bucket, s3_path, options) {
  debug('add_s3_file_to_queue', user_id, app_id, s3_bucket, s3_path);
  if (!user_id) throw new Error('user_id required');
  if (!app_id) throw new Error('app_id required');
  if (!s3_bucket) throw new Error('s3_bucket required');
  if (!s3_path) throw new Error('s3_path required');
  options = options || {};

  return model.apps.set_processing_status(app_id, 'Pending')
  .then(function() {
    queue.add({
      user_id: user_id,
      app_id: app_id,
      s3_bucket: s3_bucket,
      s3_path: s3_path,
      run_tests: !!options.run_tests
    });
  });
};

function download_file(url) {
  return request.getAsync(url, {encoding: null})
  .then(function(response) {
    if (response.statusCode !== 200) {
      throw new Error('HTTP ' + response.statusCode + ': ' + response.statusMessage);
    }
    return response.body;
  });
}

function download_apk(job_data) {
  debug('Downloading app', job_data.public_url || [job_data.s3_bucket, job_data.s3_path]);
  return job_data.public_url
    ? download_file(job_data.public_url)
    : s3.download(job_data.s3_bucket, job_data.s3_path);
}

function check_app_identifier(apk_info, expected_identifier) {
  if (expected_identifier && apk_info.identifier !== expected_identifier) {
    throw new Error('Incorrect app identifier: ' + apk_info.identifier);
  }
}

function upload_to_appetize(existing_app, apk_url) {
  debug('Uploading to appetize.io');
  return (existing_app.publicKey
    ? appetizeio.update_app(existing_app.privateKey, apk_url, 'android')
    : appetizeio.create_app(apk_url, 'android')
  );
}

function run_tests(job_data) {
  if (job_data.run_tests) {
    console.log('Running tests for ' + job_data.app_id);
    return test_runner.run_all(job_data.app_id);
  } else {
    console.log('Skipping tests for ' + job_data.app_id);
    return Promise.resolve();
  }
}

function email_app_notification_to_admins(user_id, new_app, existing_app) {
  return model.users.get(user_id)
  .then(function(user) {
    return existing_app.publicKey
      ? email.send_to_admins(email.message.updated_app(user, new_app))
      : email.send_to_admins(email.message.new_app(user, new_app));
  });
}

function email_error_to_admins(err, job_data) {
  return model.users.get(job_data.user_id)
  .catch(function(err) {
    console.error(err.stack || err);
    return { id: job_data.user_id };
  })
  .then(function(user) {
    return email.send_to_admins(email.message.error('/app/' + job_data.app_id, user, err));
  });
}

function update_app_model(job_data, existing_app, apk_info, modified_apk_url, appetize_resp) {
  var new_app = _.extend({}, existing_app, apk_info, {
    user_app_url: job_data.url || s3.url(job_data.s3_bucket, job_data.s3_path),
    app_url: modified_apk_url,
    privateKey: appetize_resp.privateKey,
    publicKey: appetize_resp.publicKey,
    updated_at: Date.now()
  });

  return db.apps().insert(new_app)
  .then(function() {
    return new_app;
  });
}

if (cluster.isWorker) {
  debug('Starting worker');

  queue.process(function(job) {
    debug('Processing', job.data);

    return model.apps.set_processing_status(job.data.app_id, 'Processing')
    .then(function() { return job.data; })
    .then(download_apk)
    .then(tmp.save_file)
    .then(inject_chetbot.add_chetbot_to_apk)
    .then(function(modified_apk_file) {
      var apk_info = get_apk_info(modified_apk_file);

      var new_app_s3_filename = shortid.generate() + '.chetbot.apk';
      debug('Uploading ' + modified_apk_file + ' to S3', new_app_s3_filename);
      return Promise.join(
        db.apps().find(job.data.app_id),
        s3.upload(modified_apk_file, 'chetbot-apps-v1', new_app_s3_filename)
      )
      .spread(function(existing_app, modified_apk_url) {
        check_app_identifier(apk_info, existing_app.identifier);

        return upload_to_appetize(existing_app, modified_apk_url)
        .then(function(appetize_resp) {
          return update_app_model(job.data, existing_app, apk_info, modified_apk_url, appetize_resp)
          .then(function(new_app) {
            return run_tests(job.data)
            .then(function() {
              return model.apps.mark_as_processed(job.data.app_id);
            })
            .then(function() {
              // Notify admins (no blocking)
              email_app_notification_to_admins(job.data.user_id, new_app, existing_app);
            });
          });
        });
      });
    })
    .catch(function(err) {
      console.error(err.stack || err);
      return model.apps.set_processing_error(job.data.app_id, err)
      .then(function() {
        // Email error (non blocking)
        email_error_to_admins(err, job.data);
      });
    });
  });
}
