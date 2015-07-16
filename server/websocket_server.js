exports.add_routes = function(app) {

  var expressWs = require('express-ws')(app);
  var auth = require('./auth');

  var devices = {};
  var requires_response = {};

  app.ws('/api/client',
    auth.login_required,
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

          console.log('commands (' + message.device + '): ' + JSON.stringify(message.commands));
          requires_response[message.device] = ws;
          var device = devices[message.device];
          if (device) {
            device.send(messageStr);
          } else {
            console.error('Device not found: ' + message.device);
            ws.send(JSON.stringify({
              error: 'Device not found: ' + message.device
            }));
          }
        }
      )
    }
  );

  app.ws('/api/device', function(ws, req) {
    ws.on('message', function(messageStr) {
      var message = JSON.parse(messageStr);

      if (message.register_device) {
        console.log('new device registered: ' + message.register_device);
        devices[message.register_device] = ws;

      } else if (message.device && ('result' in message || 'error' in message)) {
        console.log('result (' + message.device + '): ' + (message.result || message.error));
        requires_response[message.device].send(messageStr);
        delete requires_response[message.device];

      } else {
        console.log('dunno what to do with: ' + messageStr);
      }
    });
    // TODO: remove device from 'devices' when connection closed
  });

};
