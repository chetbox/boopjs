exports.add_routes = function(app) {

  var shortid = require('shortid');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var url = require('url');
  var host_address = require('config').get('host.address');

  var db = require('./db');
  var auth = require('./auth');
  var devices = require('./devices');
  var s3 = require('./s3');
  var fail_on_error = require('./util').fail_on_error;
  var appetizeio = require('./apps/appetizeio');
  var inject_chetbot = require('./apps/android/inject-chetbot');
  var android_app_info = require('./apps/android/info');

  var NEW_TEST_TEMPLATE = '// Write your test here\n\n';

  function ensure_code_belongs_to_app(req, res, next) {
    db.code().find({hash: req.params.app_id, range: req.params.code_id})
    .then(function(code) {
      if (!code) {
        res.status(404).send('Code ' + req.params.code_id + ' not found');
      }
      next();
    })
    .catch(fail_on_error(res));
  }

  function ensure_user_can_access_app(req, res, next) {
    // Admins always have access
    if (req.user.admin) {
      next();
      return;
    }

    if (!req.user.apps || req.user.apps.indexOf(req.params.app_id) === -1) {
      res.status(403).send('You don\'t have access to this app');
    } else {
      next();
    }
  }

  function create_and_upload_chetbot_apk(user_apk_url) {
    // TODO: cleanup downloaded files
    // TODO: return immediately and show user a progress page

    console.log('Downloading app', user_apk_url);
    return s3.download(user_apk_url)
    .then(function(apk) {
      console.log('Getting info from APK');
      var apk_info = android_app_info(apk);
      console.log('  ' + apk_info.name)
      return [apk, apk_info];
    })
    .spread(function(apk, apk_info) {
      console.log('Adding Chetbot to APK', apk);
      return [apk_info, inject_chetbot.add_chetbot_to_apk(apk)];
    })
    .spread(function(apk_info, modified_apk_file) {
      console.log('Uploading ' + modified_apk_file + ' to S3');
      return [apk_info, s3.upload(modified_apk_file, 'chetbot-apps-v1', url.parse(user_apk_url).pathname + '.chetbot.apk')];
    });
  }

  function check_allowed_code_update(key) {
    return function(req, res, next) {
      if (_.contains(['name', 'content'], req.params[key])) {
        next();
      } else {
        res.status(400).send('Cannot update code key: ' + req.params[key]);
      };
    }
  }

  app.get('/sign_s3',
    auth.login_required,
    function(req, res) {
      s3.client_upload_request(
        'chetbot-apps',
        shortid.generate() + '/app.apk'
      )
      .then(function(upload_req) {
        res.json(upload_req);
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/apps',
    auth.login_required,
    function(req, res) {
      new Promise(function(resolve) {
        return resolve(req.user.apps
          ? db.apps().batchFind(req.user.apps)
          : []
        );
      })
      .then(function(apps) {
        res.render('apps', {
          user: req.user,
          apps: apps
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.post('/apps',
    auth.login_required,
    // TODO: check that user is allowed to create another app
    function(req, res) {
      var user_apk_url = req.body.app_url;
      var new_app_id = shortid.generate();
      var new_code_id = shortid.generate();

      create_and_upload_chetbot_apk(user_apk_url)
      .spread(function(apk_info, modified_apk_url) {
        console.log('Creating appetize.io app', modified_apk_url);
        return [apk_info, modified_apk_url, appetizeio.create_app(modified_apk_url, 'android')];
      })
      .spread(function(apk_info, modified_apk_url, appetize_resp) {
        console.log('Creating app', new_app_id);
        return Promise.all([
          db.users().find(req.user.id),
          db.apps().insert(
            _.extend({
              id: new_app_id,
              platform: 'android',
              user_app_url: user_apk_url,
              app_url: modified_apk_url,
              publicKey: appetize_resp.publicKey,
              privateKey: appetize_resp.privateKey
            },
            apk_info)
          ),
          db.code().insert({
            id: new_code_id,
            app_id: new_app_id,
            content: NEW_TEST_TEMPLATE
          })
        ]);
      })
      .spread(function(user) {
        user.apps = _.union(user.apps, [new_app_id]); // Keep existing info (dynasty's .update is broken)
        return db.users().update(user);
      })
      .then(function() {
        // Take the user straight to their first test
        res.redirect('/app/' + new_app_id + '/edit/' + new_code_id);
      })
      .catch(fail_on_error(res));
    }
  );

  // browsers aren't happy doing a PUT from <form>s so we use POST
  app.post('/app/:app_id',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      // TODO: check that app has the same package name

      var app_id = req.params.app_id;
      var user_apk_url = req.body.app_url;

      create_and_upload_chetbot_apk(user_apk_url)
      .spread(function(apk_info, modified_apk_url) {
        return [apk_info, modified_apk_url, db.apps().find(app_id)];
      })
      .spread(function(apk_info, modified_apk_url, existing_app) {
        console.log('Updating appetize.io app', modified_apk_url);
        return [apk_info, modified_apk_url, existing_app, appetizeio.update_app(existing_app.privateKey, modified_apk_url, 'android')];
      })
      .spread(function(apk_info, modified_apk_url, existing_app, appetize_resp) {
        console.log('Updating app', app_id);
        if (existing_app.privateKey !== appetize_resp.privateKey) {
          throw new Error('New private key does not match existing');
        }
        if (existing_app.publicKey !== appetize_resp.publicKey) {
          throw new Error('New public key does not match existing');
        }
        existing_app.user_app_url = user_apk_url;
        existing_app.app_url = modified_apk_url;
        existing_app = _.extend(existing_app, apk_info);
        return db.apps().update(existing_app);
      })
      .then(function() {
        // refresh
        res.redirect(req.get('referer'));
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      return Promise.all([
        db.apps().find(req.params.app_id),
        db.code().findAll(req.params.app_id)
      ])
      .spread(function(app, code) {
        if (!app) {
          return res.sendStatus(404);
        }
        res.render('app', {
          user: req.user,
          app: app,
          code: code.map(function(c) {
            c.name = c.name || c.id;
            return c;
          })
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.delete('/app/:app_id',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      db.code().findAll(req.params.app_id)
      .then(function(code) {
        return code.map(function(c) {
          return db.code().remove({hash: c.app_id, range: c.id});
        });
      })
      .spread(function() {
        return db.apps().remove(req.params.app_id);
      })
      .then(function() {
        res.status(200).send('');
      })
      .catch(fail_on_error(res));
    }
  );

  app.post('/app/:app_id/edit/',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      var new_code_id = shortid.generate();
      db.code().insert({
        id: new_code_id,
        app_id: req.params.app_id,
        content: NEW_TEST_TEMPLATE
      })
      .then(function() {
        res.redirect('/app/' + req.params.app_id + '/edit/' + new_code_id);
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id/edit/:code_id',
    auth.login_required,
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      Promise.join(
        db.apps().find(req.params.app_id),
        db.code().find({hash: req.params.app_id, range: req.params.code_id}),
        devices.create_device({user: req.user})
      )
      .spread(function(app, code, device_id) {
        if (!code || !app) {
          return res.sendStatus(404);
        }
        res.render('edit', {
          user: req.user,
          device: {
            id: device_id,
            model: 'nexus5',
            orientation: 'portrait',
          },
          server: host_address,
          app: {
            icon: app.icon,
            publicKey: app.publicKey
          },
          autosave: true,
          code: _.extend(code, {
            name: code.name || code.id
          })
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.delete('/app/:app_id/edit/:code_id',
    auth.login_required,
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      db.code().remove({hash: req.params.app_id, range: req.params.code_id})
      .then(function() {
        res.status(200).send('');
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id/edit/:code_id/code',
    auth.login_required, // TODO: return forbidden if no access
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      db.code()
      .find(req.params.code_id)
      .then(function(code) {
        if (!code) {
          return res.sendStatus(404);
        }
        res.set('Content-Type', 'text/javascript');
        res.status(200).send(code.content);
      })
      .catch(fail_on_error(res));
    }
  );

  app.put('/app/:app_id/edit/:code_id/:code_key',
    auth.login_required, // TODO: return forbidden if no access
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    check_allowed_code_update('code_key'),
    function(req, res) {
      db.code().find({
        hash: req.params.app_id,
        range: req.params.code_id
      })
      .then(function(code) {
        code[req.params.code_key] = req.body;
        return db.code().update(code);
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

};
