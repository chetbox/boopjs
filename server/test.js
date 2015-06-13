var sleep = require('sleep').sleep;
var WebSocket = require('ws');

var ws = new WebSocket('ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com');
//var ws = new WebSocket('ws://localhost:8001');
 
ws.on('open', function () {
  ws.send(JSON.stringify({
    device: 'my_magic_device_1234567890',
    commands: [
        {   name:   'VIEW',
            args:   ['start']},
        {   name:   'TAP',
            args:   []}
    ]
  }));

});
 
ws.on('message', function(data, flags) {
  // flags.binary will be set if a binary data is received. 
  // flags.masked will be set if the data was masked. 
  console.log('received: ' + data);
});
