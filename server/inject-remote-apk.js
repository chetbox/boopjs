var shortid = require('shortid');
var Promise = require('bluebird');
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
  queue.add({
    user_id: user_id,
    app_id: app_id,
    public_url: url,
    run_tests: !!options.run_tests
  });
}

exports.add_s3_file_to_queue = function(user_id, app_id, s3_bucket, s3_path, options) {
  debug('add_s3_file_to_queue', user_id, app_id, s3_bucket, s3_path);
  if (!user_id) throw new Error('user_id required');
  if (!app_id) throw new Error('app_id required');
  if (!s3_bucket) throw new Error('s3_bucket required');
  if (!s3_path) throw new Error('s3_path required');
  options = options || {};
  queue.add({
    user_id: user_id,
    app_id: app_id,
    s3_bucket: s3_bucket,
    s3_path: s3_path,
    run_tests: !!options.run_tests
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

if (cluster.isWorker) {
  debug('Starting worker');

  queue.process(function(job_info) {
    var job = job_info.data;
    debug('Processing', job);
    debug('Downloading app', job.public_url || [job.s3_bucket, job.s3_path]);
    return (job.public_url
      ? download_file(job.public_url)
      : s3.download(job.s3_bucket, job.s3_path)
    )
    .then(function(file) {
      return tmp.save_file(file);
    })
    .then(function(apk_path) {
      var apk_info = get_apk_info(apk_path);
      debug('Adding Chetbot to APK', apk_path, apk_info.name);
      var modified_apk_file = inject_chetbot.add_chetbot_to_apk(apk_path);

      var new_app_filename = shortid.generate() + '.chetbot.apk';
      debug('Uploading ' + modified_apk_file + ' to S3', new_app_filename);
      Promise.join(
        model.apps.get(job.app_id),
        s3.upload(modified_apk_file, 'chetbot-apps-v1', new_app_filename)
      )
      .spread(function(existing_app, modified_apk_url) {
        if (existing_app.identifier && apk_info.identifier !== existing_app.identifier) {
          throw new Error('Incorrect app identifier: ' + apk_info.identifier);
        }

        debug('Uploading to appetize.io');
        return (existing_app.publicKey
          ? appetizeio.update_app(existing_app.privateKey, modified_apk_url, 'android')
          : appetizeio.create_app(modified_apk_url, 'android')
        )
        .then(function(appetize_resp) {
          debug('Updating app', job.app_id);
          var new_app = _.extend({}, existing_app, apk_info, {
            user_app_url: job.url || s3.url(job.s3_bucket, job.s3_path),
            app_url: modified_apk_url,
            privateKey: appetize_resp.privateKey,
            publicKey: appetize_resp.publicKey,
            updated_at: Date.now()
          });
          return db.apps().insert(new_app) // replace app
          .then(function() {
            if (job.run_tests) {
              console.log('Running tests for ' + job.app_id);
              return test_runner.run_all(job.app_id);
            }
            console.log('Skipping tests for ' + job.app_id);
          })
          .then(function() {
            return model.users.get(job.user_id);
          })
          .then(function(user) {
            return existing_app.publicKey
              ? email.send_to_admins(email.message.updated_app(user, new_app))
              : email.send_to_admins(email.message.new_app(user, new_app));
          });
        });
      });
    })
    .catch(function(err) {
      console.error(err.stack || err);
      return model.users.get(job.user_id)
      .catch(function(err) {
        console.error(err.stack || err);
        return { id: job.user_id };
      })
      .then(function(user) {
        return email.send_to_admins(email.message.error('/app/' + job.app_id, user, err));
      });
    });
  });
}
