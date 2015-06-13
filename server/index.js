var WebSocketServer = require('ws').Server;

var PORT = process.env.PORT || 8001;
var server = new WebSocketServer({ port: PORT });

var devices = {};
var requires_response = {};
 
server.on('connection', function (client) {
  client.on('message', function (messageStr) {
    console.log('\n' + messageStr);

    var message = JSON.parse(messageStr);

    if (message.name == 'REGISTER_DEVICE') {
      console.log('new device: ' + message.args[0]);
      devices[message.args[0]] = client;

    } else if (message.request && message.device && message.commands) {
      console.log('commands: ' + JSON.stringify(message.commands));
      requires_response[message.request] = client;
      devices[message.device].send(messageStr);

    } else if (message.request && ('result' in message || message['error'])) {
      console.log('result: ' + message.result || message.error);
      requires_response[message.request].send(messageStr);
      delete requires_response[message.request];

    } else {
      console.log('dunno what to do with: ' + messageStr);
    }
  });
});

console.log('Started server on port ' + PORT);
