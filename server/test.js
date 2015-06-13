var sleep = require('sleep').sleep;
var WebSocket = require('ws');

var ws = new WebSocket('ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com');
 
ws.on('open', function () {
  ws.send(JSON.stringify({name: 'REGISTER_DEVICE',
                          args: ['1234567890']}));

  sleep(1);

  ws.send(JSON.stringify({device: '1234567890',
                          name:   'TAP',
                          args:   [100, 200]}));

});
 
ws.on('message', function(data, flags) {
  // flags.binary will be set if a binary data is received. 
  // flags.masked will be set if the data was masked. 
  console.log('received: ' + data);
});
