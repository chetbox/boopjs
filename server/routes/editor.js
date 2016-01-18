exports.add_routes = function(app) {

  var shortid = require('shortid');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var host = require('config').get('host');

  var fail_on_error = require.main.require('./util').fail_on_error;
  var db = require.main.require('./db');
  var test_runner = require.main.require('./test_runner');
  var model = {
    results: require.main.require('./model/results'),
    devices: require.main.require('./model/devices'),
    code: require.main.require('./model/code'),
    apps: require.main.require('./model/apps'),
    access_tokens: require.main.require('./model/access_tokens'),
  }

  var auth = require('./auth');
  var middleware = require('./middleware');

  var DEFAULT_DEVICE = {
    model: 'nexus5',
    orientation: 'portrait',
  };

  function ensure_code_belongs_to_app(req, res, next) {
    model.code.get(req.params.app_id, req.params.code_id)
    .then(function(code) {
      if (!code) {
        res.status(404).send('Code ' + req.params.code_id + ' not found');
      }
      next();
    })
    .catch(next);
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

  app.get('/apps',
    auth.login_required,
    function(req, res, next) {
      return (req.user.apps
        ? db.apps().batchFind(req.user.apps)
        : Promise.resolve([])
      )
      .then(function(apps) {
        res.render('apps', {
          user: req.user,
          apps: apps
        });
      })
      .catch(next);
    }
  );

  app.get('/app/:app_id',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    function(req, res, next) {
      return Promise.join(
        model.apps.get(req.params.app_id),
        model.code.get_all(req.params.app_id),
        model.access_tokens.get_all_for_user(req.user.id)
      )
      .spread(function(app, code, access_tokens) {
        if (!app) {
          return res.sendStatus(404);
        }
        res.render('app', {
          user: req.user,
          app: app,
          code: code.map(function(c) {
            c.name = c.name || 'Untitled test';
            return c;
          }),
          host: host,
          access_tokens: access_tokens
        });
      })
      .catch(next);
    }
  );

  app.delete('/app/:app_id',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    function(req, res, next) {
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
          return model.code.delete(c.app_id, c.id);
        });
      })
      .spread(function() {
        return db.apps().remove(req.params.app_id);
      })
      .then(function() {
        res.status(200).send('');
      })
      .catch(next);
    }
  );

  app.post('/app/:app_id/test',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    function(req, res, next) {
      var new_code_id = shortid.generate();
      model.code.create(req.params.app_id)
      .then(function(code) {
        res.redirect('/app/' + req.params.app_id + '/test/' + code.id + '/edit');
      })
      .catch(next);
    }
  );

  app.get('/app/:app_id/test/:code_id/edit',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    function(req, res, next) {
      Promise.join(
        db.apps().find(req.params.app_id),
        model.code.get(req.params.app_id, req.params.code_id),
        model.devices.create_device({user: req.user})
      )
      .spread(function(app, code, device_id) {
        if (!code || !app) {
          return res.sendStatus(404);
        }
        res.render('edit', {
          user: req.user,
          device: _.extend({}, DEFAULT_DEVICE, {
            id: device_id,
            location: function() {
              // code.location is JSON parsed below
              return code.location
                ? (code.location.lat.toFixed(7) + ',' + code.location.lon.toFixed(7))
                : null;
            }
          }),
          server: host.address,
          app: app,
          autosave: true,
          code: _.extend({}, code, {
            name: code.name || 'Untitled test',
            location: code.location && JSON.parse(code.location)
          })
        });
      })
      .catch(next);
    }
  );

  app.get('/app/:app_id/test/:code_id/reports',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    function(req, res, next) {
      Promise.join(
        db.apps().find(req.params.app_id),
        model.code.get(req.params.app_id, req.params.code_id),
        model.results.all(req.params.code_id)
      )
      .spread(function(app, code, results) {
        if (!app || !code) {
          return res.sendStatus(404);
        }
        res.render('reports', {
          user: req.user,
          app: app,
          code: _.extend({}, code, {
            name: code.name || 'Untitled test',
            location: code.location && JSON.parse(code.location)
          }),
          results: results
        });
      })
      .catch(next);
    }
  );

  app.get('/app/:app_id/test/:code_id/report/:started_at',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    function(req, res, next) {
      Promise.join(
        model.code.get(req.params.app_id, req.params.code_id),
        model.results.get(req.params.code_id, req.params.started_at)
      )
      .spread(function(code, result) {
        res.render('report', {
          user: req.user,
          result: result,
          code: _.extend({}, code, {
            name: code.name || 'Untitled test'
          })
        });
      })
      .catch(next);
    }
  );

  app.get('/app/:app_id/test/:code_id/report/:started_at/callback',
    ensure_code_belongs_to_app,
    model.results.middleware.set_test_runner_status('opened', 'finished', 'params.code_id', 'params.started_at', 'query.access_token'),
    function(req, res, next) {
      var result = JSON.parse(req.query.response);
      test_runner.handle_result(req.params.code_id, parseInt(req.params.started_at), result)
      .then(function() {
        res.sendStatus(200);
      })
      .catch(next);
    }
  );

  app.post('/app/:app_id/test/:code_id/run',
    auth.login_required,
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    function(req, res, next) {
      test_runner.run(req.params.app_id, req.params.code_id)
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

  // Page opened by the test runner
  app.get('/app/:app_id/test/:code_id/autorun/:started_at',
    ensure_code_belongs_to_app,
    model.results.middleware.set_test_runner_status('queued', 'opened', 'params.code_id', 'params.started_at', 'query.access_token'),
    function(req, res, next) {
      Promise.join(
        db.apps().find(req.params.app_id),
        model.code.get(req.params.app_id, req.params.code_id),
        model.results.get(req.params.code_id, req.params.started_at),
        model.devices.create_device({user: null})
      )
      .spread(function(app, code, result, device_id) {
        if (!code || !app || !result) {
          return res.sendStatus(404);
        }
        res.render('run', {
          device: _.extend({}, DEFAULT_DEVICE, {
            id: device_id,
            location: function() {
              // code.location is JSON parsed below
              return code.location
                ? (code.location.lat.toFixed(7) + ',' + code.location.lon.toFixed(7))
                : null;
            }
          }),
          server: host.address,
          app: app,
          code: _.extend({}, code, {
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
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    function(req, res, next) {
      model.code.delete(req.params.app_id, req.params.code_id)
      .then(function() {
        res.status(200).send('');
      })
      .catch(next);
    }
  );

  app.get('/app/:app_id/test/:code_id/code',
    auth.login_required, // TODO: return forbidden if no access
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    function(req, res, next) {
      model.code.get(req.params.app_id, req.params.code_id)
      .then(function(code) {
        if (!code) {
          return res.sendStatus(404);
        }
        res.set('Content-Type', 'text/javascript');
        res.status(200).send(code.content);
      })
      .catch(next);
    }
  );

  app.put('/app/:app_id/test/:code_id/edit/:code_key',
    auth.login_required, // TODO: return forbidden if no access
    middleware.check_user_can_access_app('app_id'),
    ensure_code_belongs_to_app,
    check_allowed_code_update('code_key'),
    function(req, res, next) {
      model.code.get(req.params.app_id, req.params.code_id)
      .then(function(code) {
        code[req.params.code_key] = req.body || ' ';
        return db.code().insert(code);
      })
      .then(function() {
        if (req.params.code_key !== 'name') {
          return model.code.remove_latest_result(req.params.app_id, req.params.code_id)
        }
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(next);
    }
  );

};
