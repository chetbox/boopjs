/**
 * Copyright 2015 - Chetan Padia
**/

var _device_id = null;
var _ws = null;

/* Heartbeat to prevent device timing out */
var device_iframe = document.querySelector('iframe');
setInterval(function() { device_iframe.contentWindow.postMessage('heartbeat', '*'); },
      15 * 1000);

function unhandled_data(e) {
  console.error('Unhandled response', e.data);
}

function __(text_or_options) {

  var _commands = [];

  function _log_result(r) {
    console.log(r);
  }

  function _add(cmd, args) {
    _commands.push({name: cmd,
            args: args || []});
  }

  function _execute() {
    var msg = {
      'device':   _device_id,
      'commands': _commands
    }
    var deferred_result = Q.defer();
    _ws.send(JSON.stringify(msg));
    _ws.onmessage = function(e) {
      _ws.onmessage = unhandled_data;
      var resp = JSON.parse(e.data);
      if ('error' in resp) {
        deferred_result.reject(resp.error);
      } else {
        console.log(resp.result);
        deferred_result.resolve(resp);
      }
    }
    return deferred_result.promise;
  }

  function view() {}

  view.view = function(args) {
    if (typeof(args) === 'object') {
      args = [args.text, args.type, args.id];
    } else if (typeof(args) === 'string') {
      args = [args];
    }
    _add('VIEW', args)
    return view;
  }

  var selectors_cmds = ['leftmost', 'rightmost', 'topmost', 'bottommost', 'closest_to', 'further_from'];
  selectors_cmds.forEach(function(cmd) {
    view[cmd] = function() {
      _add(cmd.toUpperCase(), [].slice.call(arguments));
      return view;
    }
  });

  var action_cmds = ['tap', 'back', 'home', 'screenshot', 'text', 'id', 'type', 'count', 'exists', 'location', 'center', 'size'];
  action_cmds.forEach(function(cmd) {
    view[cmd] = function() {
      _add(cmd.toUpperCase(), [].slice.call(arguments, 1));
      return _execute();
    }
  });

  view.view(text_or_options);

  return view;
}

function wait(seconds) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, seconds * 1000);
    return deferred.promise;
}

function unpack_result(r) {
  return (typeof(r) === 'object' && 'result' in r) ? r.result : r;
}

function assert(promise, message) {
  return Q(promise).then(function(val) {
    val = unpack_result(val);
    message = message || JSON.stringify(val) + ' is not truthy.';
    if (!val) {
      throw new Error('Assestion failed: ' + message);
    }
  });
}

function assert_equals(promise_a, promise_b, message) {
  return Q.spread([Q(promise_a), Q(promise_b)], function(a, b) {
    a = unpack_result(a);
    b = unpack_result(b);
    message = message || JSON.stringify(a) + ' does not equal ' + JSON.stringify(b) + '.';
    if (a !== b) {
      throw new Error('Assestion failed: ' + message);
    }
  });
}

function not(promise) {
  return Q(promise).then(function(val) {
    return !unpack_result(val);
  });
}

__.connect = function(server, device_id) {
  if (!server) {
    console.error('No host specified');
  }
  if (!device_id) {
    console.error('No device specified');
  }

  _device_id = device_id;
  _ws = new ReconnectingWebSocket('ws://' + server + '/api/client');
  _ws.onmessage = unhandled_data;
};

window.__ = __;
window.back = __().back;
window.home = __().home;
window.screenshot = __().screenshot;
