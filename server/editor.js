exports.add_routes = function(app) {

  var shortid = require('shortid');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var url = require('url');
  var fs = require('fs');
  var host_address = require('config').get('host.address');

  var db = require('./db');
  var auth = require('./auth');
  var s3 = require('./s3');
  var run_test = require('./test_runner');
  var fail_on_error = require('./util').fail_on_error;
  var appetizeio = require('./apps/appetizeio');
  var inject_chetbot = require('./apps/android/inject-chetbot');
  var android_app_info = require('./apps/android/info');
  var email = require('./reporting/email');

  var model = {
    results: require('./model/results'),
    devices: require('./model/devices'),
    run_tokens: require('./model/run_tokens')
  }

  var welcome_code = fs.readFileSync(__dirname + '/demos/welcome.js', 'utf8');

  var DEFAULT_DEVICE = {
    model: 'nexus5',
    orientation: 'portrait',
  };

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
      if (_.contains(['name', 'content', 'location'], req.params[key])) {
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
        shortid.generate() + '/app.apk',
        req.query.file_type
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

      // Allow admins to create a new app
      if (req.body.as_user) {
        if (!req.user.admin) {
          res.sendStatus(403);
          return;
        }

        console.log('Creating app ' + new_app_id + 'for user ' + req.body.as_user + ' (admin)');
        var as_user = null;
        db.users().find(req.body.as_user)
        .then(function(u) {
          if (!u) throw 'User not found: ' + req.body.as_user;
          as_user = u;
        })
        .then(function() {
          return db.apps().insert({
            id: new_app_id,
            admins: [as_user.id],
            platform: 'android'
          });
        })
        .then(function() {
          // Keep existing info (dynasty's .update is broken)
          as_user.apps = _.union(as_user.apps, [new_app_id]);
          return db.users().insert(as_user);
        })
        .then(function() {
          res.redirect('/app/' + new_app_id);
        })
        .catch(fail_on_error(res));
        return;
      }

      create_and_upload_chetbot_apk(user_apk_url)
      .spread(function(apk_info, modified_apk_url) {
        console.log('Creating appetize.io app', modified_apk_url);
        return [apk_info, modified_apk_url, appetizeio.create_app(modified_apk_url, 'android')];
      })
      .spread(function(apk_info, modified_apk_url, appetize_resp) {
        console.log('Creating app', new_app_id);
        var app = _.extend({
          id: new_app_id,
          admins: [req.user.id],
          platform: 'android',
          user_app_url: user_apk_url,
          app_url: modified_apk_url,
          publicKey: appetize_resp.publicKey,
          privateKey: appetize_resp.privateKey
        }, apk_info);
        var code = {
          id: new_code_id,
          name: 'Untitled test',
          app_id: new_app_id,
          content: welcome_code
        };
        return [
          db.users().find(req.user.id),
          app,
          db.apps().insert(app),
          db.code().insert(code)
        ];
      })
      .spread(function(user, app) {
        user.apps = _.union(user.apps, [new_app_id]); // Keep existing info (dynasty's .update is broken)
        return [user, app, db.users().insert(user)];
      })
      .spread(function(user, app) {
        email.send_to_admins(email.message.new_app(user, app));
      })
      .then(function() {
        // Take the user straight to their first test
        res.redirect('/app/' + new_app_id + '/test/' + new_code_id + '/edit');
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
        if (existing_app.privateKey && existing_app.privateKey !== appetize_resp.privateKey) {
          throw new Error('New private key does not match existing');
        }
        if (existing_app.publicKey && existing_app.publicKey !== appetize_resp.publicKey) {
          throw new Error('New public key does not match existing');
        }
        existing_app.user_app_url = user_apk_url;
        existing_app.app_url = modified_apk_url;
        existing_app.privateKey = appetize_resp.privateKey; // ensure this is set
        existing_app.publicKey = appetize_resp.publicKey; // ensure this is set
        existing_app = _.extend(existing_app, apk_info);
        return db.apps().insert(existing_app);
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
        return [
          app,
          code,
          model.results.all_latest(
            code.map(function(c) { return c.id; })
          )
        ];
      })
      .spread(function(app, code, results) {
        if (!app) {
          return res.sendStatus(404);
        }
        res.render('app', {
          user: req.user,
          app: app,
          code: code.map(function(c, i) {
            c.name = c.name || 'Untitled test';
            c.result = results[i];
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
      db.apps().find(req.params.app_id)
      .then(function(app) {
        return app.admins || [];
      })
      .map(function(user_id) {
        return db.users().find(user_id);
      })
      .map(function(user) {
        user.apps = _.without(user.apps || [], req.params.app_id);
        return db.users().insert(user);
      })
      .then(function() {
        return db.code().findAll(req.params.app_id);
      })
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

  app.post('/app/:app_id/test',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      var new_code_id = shortid.generate();
      db.code().insert({
        id: new_code_id,
        name: 'Untitled test',
        app_id: req.params.app_id,
        content: welcome_code
      })
      .then(function() {
        res.redirect('/app/' + req.params.app_id + '/test/' + new_code_id + '/edit');
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id/test/:code_id/edit',
    auth.login_required,
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      Promise.join(
        db.apps().find(req.params.app_id),
        db.code().find({hash: req.params.app_id, range: req.params.code_id}),
        model.devices.create_device({user: req.user})
      )
      .spread(function(app, code, device_id) {
        if (!code || !app) {
          return res.sendStatus(404);
        }
        res.render('edit', {
          user: req.user,
          device: _.extend(DEFAULT_DEVICE, {
            id: device_id,
            location: function() {
              // code.location is JSON parsed below
              return code.location
                ? (code.location.lat.toFixed(7) + ',' + code.location.lon.toFixed(7))
                : null;
            }
          }),
          server: host_address,
          app: app,
          autosave: true,
          code: _.extend(code, {
            name: code.name || 'Untitled test',
            location: code.location && JSON.parse(code.location)
          })
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id/test/:code_id/reports',
    auth.login_required,
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      Promise.join(
        db.apps().find(req.params.app_id),
        db.code().find({hash: req.params.app_id, range: req.params.code_id}),
        model.results.all(req.params.code_id)
      )
      .spread(function(app, code, results) {
        if (!app || !code) {
          return res.sendStatus(404);
        }
        res.render('reports', {
          user: req.user,
          app: app,
          code: _.extend(code, {
            name: code.name || 'Untitled test',
            location: code.location && JSON.parse(code.location)
          }),
          results: results
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.post('/app/:app_id/test/:code_id/run',
    auth.login_required,
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      run_test(req.params.app_id, req.params.code_id)
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

  app.post('/app/:app_id/run',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      return db.code().findAll(req.params.app_id)
      .then(function(code) {
        return Promise.all(
          code.map(function(c) {
            return run_test(req.params.app_id, c.id);
          })
        );
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

  // Page opened by the test runner
  app.get('/app/:app_id/test/:code_id/autorun/:started_at',
    model.run_tokens.middleware.consume('access_token'),
    ensure_code_belongs_to_app,
    function(req, res) {
      Promise.join(
        db.apps().find(req.params.app_id),
        db.code().find({hash: req.params.app_id, range: req.params.code_id}),
        model.results.get(req.params.code_id, req.params.started_at),
        model.devices.create_device({user: null})
      )
      .spread(function(app, code, result, device_id) {
        if (!code || !app || !result) {
          return res.sendStatus(404);
        }
        res.render('run', {
          device: _.extend(DEFAULT_DEVICE, {
            id: device_id,
            location: function() {
              // code.location is JSON parsed below
              return code.location
                ? (code.location.lat.toFixed(7) + ',' + code.location.lon.toFixed(7))
                : null;
            }
          }),
          server: host_address,
          app: app,
          code: _.extend(code, {
            name: code.name,
            location: code.location && JSON.parse(code.location)
          }),
          started_at: result.started_at
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.delete('/app/:app_id/test/:code_id',
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

  app.get('/app/:app_id/test/:code_id/code',
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

  app.put('/app/:app_id/test/:code_id/:code_key',
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
        code[req.params.code_key] = req.body || ' ';
        return db.code().insert(code);
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

};
