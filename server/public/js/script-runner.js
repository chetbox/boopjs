function run_script(server, device_id, app_id, code_id, started_at, statements, callbacks) {

  function callback(event, data) {
    $(document).trigger('test-progress', [event, data]);
    if (callbacks[event]) callbacks[event](data);
  }

  var script = {
    statements: statements,
    name: window.location.pathname.replace(/.*\//, '')
  };

  callback('beforeStart', script.statements);

  var protocol = window.location.protocol.match(/https/) ? 'wss' : 'ws';
  var ws = new WebSocket(
    protocol + '://' + server + '/api/client'
    + '?device=' + encodeURIComponent(device_id)
    + '&app=' + encodeURIComponent(app_id)
    + (code_id
        ? '&code=' + encodeURIComponent(code_id)
        : ''
      )
    + (code_id && started_at
        ? '&started_at=' + encodeURIComponent(started_at)
        : ''
      )
  );
  ws.onopen = function() {};
  ws.onerror = function(e) {
    callback('onError', {error: e, type: 'websocket'});
    callback('onFinish');
    ws.close();
  };
  ws.onmessage = function(event) {
    var message = JSON.parse(event.data);
    if ('ready' in message) {
      callback('onStart');
      ws.send(JSON.stringify(script));
    } else if ('error' in message) {
      callback('onError', message);
      callback('onFinish', false);
    } else if ('result' in message) {
      callback('onResult', message);
    } else if ('log' in message) {
      callback('onLogMessage', message);
    } else if ('success' in message && message.success) {
      callback('onSuccess', message);
      callback('onFinish', true);
    }
  };
}
