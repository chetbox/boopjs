var WebSocketServer = require('ws').Server;

var PORT = process.env.PORT || 8001;
var server = new WebSocketServer({ port: PORT });

var devices = {};
 
server.on('connection', function (client) {
  client.on('message', function (_message) {
    console.log(_message);

    var message = JSON.parse(_message);

    switch (message.command) {

      case 'register_device':
        var device_id = message.args[0];
        console.log('new device: ' + device_id);
        devices[device_id] = client;
        break;

      case 'tap':
        console.log('tap: ' + message.args);
        devices[message.device].send(JSON.stringify(message));
        break;

      default:
        console.log('dunno what to do with: ' + message.command);
        break;
    }
  });
 
  client.send('something');
});

console.log('Started server on port ' + PORT);
