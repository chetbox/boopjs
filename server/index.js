var WebSocketServer = require('ws').Server;

var PORT = process.env.PORT || 8001;
var server = new WebSocketServer({ port: PORT });

var devices = {};
 
server.on('connection', function (client) {
  client.on('message', function (messageStr) {
    console.log(messageStr);

    var message = JSON.parse(messageStr);

    if (message.name == 'REGISTER_DEVICE') {
      console.log('new device: ' + message.args[0]);
      devices[message.args[0]] = client;

    } else if(message.device) {
      console.log('commands: ' + JSON.stringify(message.commands, null, 2));
      devices[message.device].send(JSON.stringify(message));

    } else {
      console.log('dunno what to do with: ' + messageStr);
    }
  });
});

console.log('Started server on port ' + PORT);
