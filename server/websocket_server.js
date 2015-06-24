function add_routes(app) {

  var expressWs = require('express-ws')(app);

  var devices = {};
  var requires_response = {};
  
  app.ws('/', function(ws, req) {
    ws.on('message', function(messageStr) {
      console.log('\n' + messageStr);

      var message = JSON.parse(messageStr);

      if (message.name == 'REGISTER_DEVICE_SESSION') {
        console.log('new device session: ' + message.args[0]);
        devices[message.args[0]] = ws;

      } else if (message.device && message.commands) {
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

      } else if (message.device && ('result' in message || 'error' in message)) {
        console.log('result (' + message.device + '): ' + message.result || message.error);
        requires_response[message.device].send(messageStr);
        delete requires_response[message.device];

      } else {
        console.log('dunno what to do with: ' + messageStr);
      }
    });
  });

}

exports.add_routes = add_routes;
