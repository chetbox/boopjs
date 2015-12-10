exports.add_routes = function(app) {

  var _ = require('underscore');
  var Promise = require('bluebird');

  var auth = require('./auth');
  var db = require('./db');
  var model = {
    results: require('./model/results'),
    devices: require('./model/devices')
  }

  var expressWs = require('express-ws')(app);

  var devices_connected = {};
  var clients_connected = {};

  function fail_on_error(ws, close_immediately) {
    return function(e) {
      console.error(e.stack || e);
      ws.result_key = undefined;
      ws.send(JSON.stringify({
        error: e.toString()
      }));
      if (close_immediately) ws.close();
    }
  }

  app.ws('/api/client',
    function(ws, req) {
      var now = Date.now();
      model.devices.check_device_access(req.query.device, req.user)
      .then(function(device) {
        return [
          device,
          req.query.app
            ? db.v2.apps.get({Key: {id: req.query.app}})
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
        return [app, code];
      })
      .spread(function(app, code) {
        if (!code) return; // Not running a saved script, do not save results
        return req.query.started_at
          ? model.results.check_exists(code.id, req.query.started_at)
          : model.results.create(code.id, now, app);
      })
      .then(function(result_key) {
        // Allow /api/device endpoint to find the key when saving results
        ws.result_key = result_key;
      })
      .catch(fail_on_error(ws, true));

      ws.on('message',
        function(messageStr) {
          var message = JSON.parse(messageStr);

          (ws.result_key
            ? model.results.set_report( // We're saving results so we'll need a copy of the script
                ws.result_key,
                model.results.report_from_statements(message.statements)
              )
            : Promise.resolve()
          )
          .then(function() {
            clients_connected[req.query.device] = ws;
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
    }
  );

  app.ws('/api/device', function(ws, req) {

    function set_status(finished, message) {
      // TODO
    }

    ws.on('message', function(messageStr) {
      var message = JSON.parse(messageStr);

      if (message.register_device) {
        console.log('registering device: ' + message.register_device);
        model.devices.check_device_exists(message.register_device)
        .then(function() {
          ws.device_registered = message.register_device;
          devices_connected[message.register_device] = ws;
        })
        .catch(fail_on_error(ws));

      } else if (ws.device_registered) {
        console.log('response:', messageStr.substring(0, 200));
        var client = clients_connected[ws.device_registered];

        ws.result_key = (client && client.result_key) || ws.result_key;
        if (ws.result_key) {
          model.results.update(ws.result_key, message)
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
          console.log('Device ' + device + ' disconnected');
          delete devices_connected[device];
        }
      }
    });
  });

};
