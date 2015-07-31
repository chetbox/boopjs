exports.add_routes = function(app) {

  var expressWs = require('express-ws')(app);
  var auth = require('./auth');
  var devices = require('./devices');

  var devices_connected = {};
  var clients_connected = {};

  function fail_on_error(ws) {
    return function(e) {
      console.error(e.stack || e);
      ws.send(JSON.stringify({
        error: e.toString()
      }));
    }
  }

  app.ws('/api/client',
    function(ws, req) {
      ws.on('message',
        function(messageStr) {
          var message = JSON.parse(messageStr);

          if (!message.device) {
            var error_msg = 'Target device not specified';
            console.error(error_msg + '\n  ' + messageStr);
            ws.send(JSON.stringify({error: error_msg}));
            return;
          }

          // TODO: fix client authentication
          // devices.check_device_access(message.device, req.user).then(function() {
            clients_connected[message.device] = ws;
            var device_socket = devices_connected[message.device];
            if (device_socket) {
              device_socket.send(messageStr);
            } else {
              console.error('Device not in use: ' + message.device);
              ws.send(JSON.stringify({
                error: 'Device not in use: ' + message.device
              }));
            }
          // })
          // .catch(fail_on_error(ws));
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
    ws.on('message', function(messageStr) {
      var message = JSON.parse(messageStr);

      if (message.register_device) {
        console.log('registering device: ' + message.register_device);
        devices.check_device_exists(message.register_device)
        .then(function() {
          devices_connected[message.register_device] = ws;
        })
        .catch(fail_on_error(ws));

      } else if (message.device && ('result' in message || 'error' in message)) {
        console.log('result (' + message.device + '): ' + (message.result || message.error));
        clients_connected[message.device].send(messageStr);

      } else {
        console.error('dunno what to do with: ' + messageStr);
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
