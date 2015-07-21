exports.add_routes = function(app) {

  var shortid = require('shortid');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var url = require('url');

  var db = require('./db');
  var auth = require('./auth');
  var devices = require('./devices');
  var apps_s3 = require('./apps/s3');
  var appetizeio = require('./apps/appetizeio');
  var inject_chetbot = require('./android/inject-chetbot');

  function fail_on_error(res) {
    return function(e) {
      console.error(e.stack || e);
      res.status(500).send(e.toString());
    }
  }

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
    if (!req.user.apps || req.user.apps.indexOf(req.params.app_id) === -1) {
      res.status(403).send('You don\'t have access to this app');
    } else {
      next();
    }
  }

  function create_and_upload_chetbot_apk(user_apk_url) {
    // TODO: store package name of app and allow replacing
    // TODO: store name and icon of app to show in UI
    // TODO: cleanup downloaded files
    // TODO: return immediately and show user a progress page

    console.log('Downloading app', user_apk_url);
    return apps_s3.download(user_apk_url)
    .then(function(apk) {
      console.log('Adding Chetbot to APK', apk);
      return inject_chetbot(apk);
    })
    .then(function(modified_apk_file) {
      console.log('Uploading ' + modified_apk_file + ' to S3');
      return apps_s3.upload(modified_apk_file, 'chetbot-apps-v1', url.parse(user_apk_url).pathname + '.chetbot.apk');
    })
    .then(function(modified_apk_url) {
      console.log('Creating appetize.io app', modified_apk_url);
      return [modified_apk_url, appetizeio.create_app(modified_apk_url, 'android')];
    });
  }

  app.get('/sign_s3',
    auth.login_required,
    function(req, res) {
      apps_s3.client_upload_request(
        'chetbot-apps',
        req.user.id + '/' + shortid.generate() + '.apk'
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
      res.render('apps', {
        user: req.user
      });
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
      .spread(function(modified_apk_url, appetize_resp) {
        console.log('Creating app', new_app_id);
        return Promise.all([
          db.apps().insert({
            id: new_app_id,
            platform: 'android',
            user_app_url: user_apk_url,
            app_url: modified_apk_url,
            publicKey: appetize_resp.publicKey,
            privateKey: appetize_resp.privateKey
          }),
          db.code().insert({
            id: new_code_id,
            app_id: new_app_id,
            content: '// Write your test here\n\n'
          })
        ]);
      })
      .then(function() {
        req.user.apps = _.union(req.user.apps, [new_app_id]); // Keep existing info (dynasty's .update is broken)
        return db.users().update(req.user);
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
      .spread(function(modified_apk_url, appetize_resp) {
        return [modified_apk_url, db.apps().find(app_id)];
      })
      .spread(function(modified_apk_url, app) {
        console.log('Updating app', app_id);
        app.user_app_url = user_apk_url;
        app.app_url = modified_apk_url;
        return [app, db.apps().update(app)];
      })
      .then(function(app) {
        // refresh
        res.redirect(req.url);
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
          code: code
        });
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
          app: {
            publicKey: app.publicKey
          },
          autosave: true,
          code: code
        });
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

  app.put('/app/:app_id/edit/:code_id/code',
    auth.login_required, // TODO: return forbidden if no access
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      db.code().update({
        id: req.params.code_id,
        app_id: req.params.app_id,
        content: req.body || null
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

};
