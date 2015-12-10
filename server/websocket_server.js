exports.add_routes = function(app) {

  var _ = require('underscore');
  var Promise = require('bluebird');

  var auth = require('./auth');
  var devices = require('./devices');
  var db = require('./db');

  var expressWs = require('express-ws')(app);

  var devices_connected = {};
  var clients_connected = {};

  function fail_on_error(ws, close_immediately) {
    return function(e) {
      console.error(e.stack || e);
      ws.send(JSON.stringify({
        error: e.toString()
      }));
      if (close_immediately) ws.close();
    }
  }

  app.ws('/api/client',
    function(ws, req) {
      var required = ['device'];
      new Promise(function(resolve, reject) {
        if (!req.query.device) {
          reject('"device" not specified.');
          return;
        }
        resolve();
      })
      .then(function() {
        return devices.check_device_access(req.query.device, req.user);
      })
      .then(function() {
        return [
          db.v2.devices.get({Key: {id: req.query.device}}),
          req.query.code && req.query.app
            ? db.v2.code.get({Key: {id: req.query.code, app_id: req.query.app}})
            : { id: null } // => REPL or demo. Do not save.
        ];
      })
      .spread(function(device, code) {
        if (!device) throw 'Device does not exist: ' + req.query.device;
        if (!code) throw 'Code \'' + req.query.code + '\' does not exist for app: ' + req.query.app;
        if (!(req.user && req.user.admin)
            && !device.skip_auth
            && !_.contains(req.user.apps, req.query.app)) {
          throw 'User does not have access to app';
        }
        return code;
      })
      .then(function(code) {
        if (!code.id) return; // Not running a saved script, do not save
        var key = { code_id: code.id, started_at: Date.now() };
        return req.query.started_at
          ? db.v2.results.get({ // Check results exist
              code_id: req.query.code,
              started_at: req.query.started_at
            }).then(function(result) {
              console.log('Using existing report:', result);
              if (!result)
                throw 'Report started at ' + req.query.started_at + ' not found';
            })
          : db.v2.results.put({ // Create a new result
              Item: _.extend({}, key, { report: [] })
            }).then(function() {
              console.log('Creating new report:', key);
              return key;
            });
      })
      .then(function(result_key) {
        // Allow /device endpoint to find the key
        ws.result_key = result_key;
      })
      .catch(fail_on_error(ws, true));

      ws.on('message',
        function(messageStr) {
          // TODO: store all statements to execute in Report[]

          clients_connected[req.query.device] = ws;
          var device_socket = devices_connected[req.query.device];
          if (device_socket) {
            device_socket.send(messageStr);
          } else {
            fail_on_error(ws)('Device not in use: ' + req.query.device);
          }
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
        devices.check_device_exists(message.register_device)
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
          // Save this result
          db.v2.results.update({
            Key: ws.result_key,
            UpdateExpression: 'SET report = list_append(report, :result)',
            ExpressionAttributeValues: {':result': [message]}
          })
          .catch(fail_on_error(client));
        }

        if (client) {
          ws.result_key = ws.result_key || client.result_key;
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
