function run_script(server, device_id, statements, callbacks) {

  function callback(event, data) {
    if (callbacks[event]) callbacks[event](data);
  }

  var script = {
    statements: statements,
    name: window.location.pathname.replace(/.*\//, ''),
    device: device_id
  };

  callback('beforeStart', script.statements);

  var ws = new WebSocket('ws://' + server + '/api/client');
  ws.onopen = function() {
    callback('onStart');
    ws.send(JSON.stringify(script));
  };
  ws.onerror = function(e) {
    callback('onError', {error: e, type: 'websocket'});
    callback('onFinish');
    ws.close();
  };
  ws.onmessage = function(event) {
    var message = JSON.parse(event.data);
    if ('error' in message) {
      if ('line' in message) {
        callback('onResult', message);
      } else {
        callback('onError', message);
        callback('onFinish');
        ws.close();
      }
      return;
    }

    if ('result' in message) {
      callback('onResult', message);
    }

    if ('success' in message) {
      callback('onSuccess', message);
      callback('onFinish');
      ws.close();
    }
  };
}
