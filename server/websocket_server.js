function add_routes(app) {

  var expressWs = require('express-ws')(app);

  var devices = {};
  var requires_response = {};
  
  app.ws('/', function(ws, req) {
    ws.on('message', function(messageStr) {
      console.log('\n' + messageStr);

      var message = JSON.parse(messageStr);

      if (message.name == 'REGISTER_DEVICE') {
        console.log('new device: ' + message.args[0]);
        devices[message.args[0]] = ws;

      } else if (message.request && message.device && message.commands) {
        console.log('commands: ' + JSON.stringify(message.commands));
        requires_response[message.request] = ws;
        var device = devices[message.device];
        if (device) {
          device.send(messageStr);
        } else {
          console.error('Device not found: ' + message.device);
          ws.send(JSON.stringify({
            error: 'Device not found: ' + message.device
          }));
        }

      } else if (message.request && ('result' in message || message['error'])) {
        console.log('result: ' + message.result || message.error);
        requires_response[message.request].send(messageStr);
        delete requires_response[message.request];

      } else {
        console.log('dunno what to do with: ' + messageStr);
      }
    });
  });

}

exports.add_routes = add_routes;
