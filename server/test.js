var sleep = require('sleep').sleep;
var WebSocket = require('ws');

var ws = new WebSocket('ws://localhost:8001');
 
ws.on('open', function () {
  ws.send(JSON.stringify({command: 'register_device',
                          args:    ['1234567890']}));

  sleep(1);

  ws.send(JSON.stringify({device:  '1234567890',
                          command: 'tap',
                          args:    [100, 200]}));

});
 
ws.on('message', function(data, flags) {
  // flags.binary will be set if a binary data is received. 
  // flags.masked will be set if the data was masked. 
  console.log('received: ' + data);
});
