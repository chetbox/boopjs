exports.add_routes = function(app) {

  var shortid = require('shortid');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var url = require('url');

  var db = require('./db');
  var auth = require('./auth');
  var apps_s3 = require('./apps/s3');
  var appetizeio = require('./apps/appetizeio');
  var inject_chetbot = require('./android/inject-chetbot');

  function fail_on_error(res) {
    return function(e) {
      console.error(e.stack || e);
      res.status(500).send(e.toString());
    }
  }

  // TODO: cache DB lookup
  function ensure_code_belongs_to_app(req, res, next) {
    db.code().find({hash: req.params.code_id, range: req.params.app_id})
    .then(function(code) {
      if (!code) {
        throw new Error('Code not found');
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

  app.post('/app',
    auth.login_required,
    // TODO: check that user is allowed to create another app
    function(req, res) {
      var new_app_id = shortid.generate();
      var new_code_id = shortid.generate();

      // TODO: store package name of app and allow replacing
      // TODO: store name and icon of app to show in UI

      var user_apk_url = req.body.app_url;
      var modified_apk_url = null;

      // TODO: cleanup downloaded files
      // TODO: return immediately and show user a progress page
      console.log('Downloading app', user_apk_url);
      apps_s3.download(user_apk_url)
      .then(function(apk) {
        console.log('Adding Chetbot to APK', apk);
        return inject_chetbot(apk);
      })
      .then(function(apk) {
        console.log('Uploading ' + apk + ' to S3');
        return apps_s3.upload(apk, 'chetbot-apps-v1', url.parse(user_apk_url).pathname + '.chetbot.apk');
      })
      .then(function(url) {
        modified_apk_url = url;
        console.log('Creating appetize.io app', modified_apk_url);
        return appetizeio.create_app(modified_apk_url, 'android');
      })
      .then(function(appetize) {
        console.log('Recording app in database', new_app_id);
        return Promise.all([
          db.apps().insert({
            id: new_app_id,
            platform: 'android',
            code_id: new_code_id, // TODO: fix gross hack because we can't search 'code' table by range key (app_id)
            user_app_url: user_apk_url,
            app_url: modified_apk_url,
            publicKey: appetize.publicKey,
            privateKey: appetize.privateKey
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
        res.redirect('/app/' + new_app_id + '/edit/' + new_code_id);
      })
      .catch(fail_on_error(res));
    }
  );

  // Temporarily just redirect the only code associated with this app
  // TODO: app.get('/app/:id') -> list of tests for app
  app.get('/app/:app_id',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      db.apps().find(req.params.app_id)
      .then(function(app) {
        if (app) {
          res.redirect('/app/' + req.params.app_id + '/edit/' + app.code_id);
        } else {
          throw new Error('App/code not found');
        }
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
        db.code().find({hash: req.params.code_id, range: req.params.app_id})
      )
      .spread(function(app, code) {
        if (!code || !app) {
          return res.sendStatus(404);
        }
        res.render('edit', {
          device: {
            id: shortid.generate(),
            model: 'nexus5',
            orientation: 'portrait',
          },
          app: {
            publicKey: app.publicKey
          },
          autosave: true,
          code: code.content
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
