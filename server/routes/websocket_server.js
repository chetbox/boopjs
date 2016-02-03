var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

exports.add_routes = function(app, server) {

  var _ = require('underscore');
  var Promise = require('bluebird');

  var db = require.main.require('./db');
  var reporting = {
    email: require.main.require('./reporting/email'),
    test_reports: require.main.require('./reporting/test-reports'),
  };
  var model = {
    users: require.main.require('./model/users'),
    apps: require.main.require('./model/apps'),
    results: require.main.require('./model/results'),
    devices: require.main.require('./model/devices')
  };

  var auth = require('./auth');

  var expressWs = require('express-ws')(app, server);

  var devices_connected = {};
  var clients_connected = {};

  function fail_on_error(ws, close_immediately) {
    return function(e) {
      console.error(e.stack || e);
      if (ws && ws.readyState === 1 /* (Open) */) {
        ws.result_key = undefined;
        ws.send(JSON.stringify({
          error: e.toString()
        }));
        if (close_immediately) ws.close();
      }
    }
  }

  app.ws('/api/client', function(ws, req) {

    debug('client: connected', req.query);

    var now = Date.now();
    model.devices.check_device_access(req.query.device, req.user)
    .then(function(device) {
      return [
        device,
        req.query.app
          ? db.v2.apps.get({Key: {id: req.query.app}})
            .then(function(app) {
              if (!app) throw 'App "' + req.query.app + '" does not exist';
              return app;
            })
          : Promise.resolve(),
        req.query.code && req.query.app
          ? db.v2.code.get({Key: {id: req.query.code, app_id: req.query.app}})
            .then(function(code) {
              if (!code) throw 'Code "' + req.query.code + '" does not exist';
              return code;
            })
          : Promise.resolve()
      ]
    })
    .spread(function(device, app, code) {
      if (!(req.user && req.user.admin)
          && !device.skip_auth
          && !_.contains(req.user.apps, req.query.app)) {
        throw 'User does not have access to app';
      }
      return [code, app];
    })
    .spread(function(code, app) {
      if (code) {
        return req.query.started_at
          ? model.results.get(code.id, req.query.started_at) // Run on server (already "started" in DB)
          : model.results.create(code.id, now, app);         // Run by user
      }
    })
    .then(function(result) {
      clients_connected[req.query.device] = ws;

      // Allow /api/device endpoint to find the key when saving results
      if (result) {
        var key = model.results.key(result);
        debug('client: saving to', key);
        ws.result_key = key;
      }
    })
    .then(function() {
      ws.send(JSON.stringify({ready: true}));
    })
    .catch(fail_on_error(ws, true));

    ws.on('message',
      function(messageStr) {
        var message = JSON.parse(messageStr);

        debug('client: message', messageStr.substring(0, 200));

        (ws.result_key
          ? model.results.set_report( // We're saving results so we'll need a copy of the script
              ws.result_key,
              model.results.report_from_statements(message.statements)
            )
          : Promise.resolve()
        )
        .then(function() {
          var device_socket = devices_connected[req.query.device];
          if (device_socket) {
            device_socket.send(messageStr);
          } else {
            fail_on_error(ws)('Device not in use: ' + req.query.device);
          }
        })
        .catch(fail_on_error(ws));
      }
    );
    ws.on('close', function() {
      // TODO: optimise
      for (var device in clients_connected) {
        if (clients_connected.hasOwnProperty(device) && clients_connected[device] == ws) {
          console.log('Client for device ' + device + ' disconnected');
          delete clients_connected[device];
        }
      }
    });
  });

  app.ws('/api/device', function(ws, req) {

    debug('device: connected', req.query.id);

    if (!req.query.id) {
      fail_on_error(ws, true)(new Error('Device ID not specified'));
      return;
    }

    model.devices.check_device_exists(req.query.id)
    .then(function() {
      ws.device_registered = req.query.id;
      devices_connected[req.query.id] = ws;
    })
    .catch(fail_on_error(ws, true));

    ws.on('message', function(messageStr) {
      var message = JSON.parse(messageStr);

      if (ws.device_registered) {
        debug('device: response', messageStr.substring(0, 200));
        var client = clients_connected[ws.device_registered];

        ws.result_key = client ? client.result_key : ws.result_key;
        if (ws.result_key) {
          debug('device: saving response');
          model.results.update(ws.result_key, message)
          .then(function(app) {
            if (app && app.pending_report && !app.running) {
              debug('Sending email report');
              Promise.join(
                model.users.emails_for_users(app.admins.values),
                reporting.test_reports.app_results(app.id)
              )
              .spread(function(recipients, message) {
                return reporting.email.send_to(recipients, message);
              })
              .then(function() {
                return model.apps.set_pending_report(app.id, false);
              });
              return null; // The websocket should not wait for emails or report email errors
            }
          })
          .catch(fail_on_error(client));
        }

        if (client) {
          client.send(messageStr);
        } else {
          console.warn('No client connected for device "' + ws.device_registered + '". Ignoring.');
        }

      } else {
        fail_on_error(ws, true)('This device has not been registered');
      }
    });
    ws.on('close', function() {
      // TODO: optimise
      for (var device in devices_connected) {
        if (devices_connected.hasOwnProperty(device) && devices_connected[device] == ws) {
          debug('device: disconnected', device);
          delete devices_connected[device];
        }
      }
    });
  });

};
