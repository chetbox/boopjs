exports.add_routes = function(app) {

  var expressWs = require('express-ws')(app);
  var auth = require('./auth');
  var devices = require('./devices');

  var devices_in_use = {};
  var requires_response = {};

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

          devices.check_device_access(message.device, req.user).then(function() {
            console.log('commands (' + message.device + '): ' + JSON.stringify(message.commands));
            requires_response[message.device] = ws;
            var device = devices_in_use[message.device];
            if (device) {
              device.send(messageStr);
            } else {
              console.error('Device not in use: ' + message.device);
              ws.send(JSON.stringify({
                error: 'Device not in use: ' + message.device
              }));
            }
          })
          .catch(fail_on_error(ws));
        }
      )
    }
  );

  app.ws('/api/device', function(ws, req) {
    ws.on('message', function(messageStr) {
      var message = JSON.parse(messageStr);

      if (message.register_device) {
        console.log('registering device: ' + message.register_device);
        devices.check_device_exists(message.register_device)
        .then(function() {
          devices_in_use[message.register_device] = ws;
        })
        .catch(fail_on_error(ws));

      } else if (message.device && ('result' in message || 'error' in message)) {
        console.log('result (' + message.device + '): ' + (message.result || message.error));
        requires_response[message.device].send(messageStr);
        delete requires_response[message.device];

      } else {
        console.error('dunno what to do with: ' + messageStr);
      }
    });
    // TODO: remove device from 'devices_in_use' when connection closed
  });

};
