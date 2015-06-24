/**
 * Copyright 2015 - Chetan Padia
**/

var chetbot_session = null;
var _ws = new ReconnectingWebSocket('ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com');

/* Heartbeat to prevent device timing out */
var device_iframe = document.querySelector('iframe');
setInterval(function() { device_iframe.contentWindow.postMessage('heartbeat', '*'); },
      60 * 1000);

function __(text_or_options) {

  var _commands = [];

  function unhandled_data(e) {
    console.error('Unhandled response', e.data);
  }
  _ws.onmessage = unhandled_data;

  function _log_result(r) {
    console.log(r);
  }

  function _add(cmd, args) {
    _commands.push({name: cmd,
            args: args || []});
  }

  function _execute(result_handler) {
    result_handler = result_handler || _log_result;
    var msg = {
      'device':   chetbot_session,
      'commands': _commands
    }
    _ws.send(JSON.stringify(msg));
    _ws.onmessage = function(e) {
      _ws.onmessage = unhandled_data;
      var resp = JSON.parse(e.data);
      if (resp.error) {
        console.error(resp.error);
      } else {
        result_handler(resp.result);
      }
    }
  }

  function view() {}

  var selectors_cmds = ['view', 'leftmost', 'rightmost', 'topmost', 'bottommost', 'closest_to', 'further_from'];
  selectors_cmds.forEach(function(cmd) {
    view[cmd] = function() {
      _add(cmd.toUpperCase(), [].slice.call(arguments));
      return view;
    }
  });

  var action_cmds = ['tap', 'back', 'text', 'id', 'type', 'count', 'exists', 'location', 'center', 'size'];
  action_cmds.forEach(function(cmd) {
    view[cmd] = function() {
      _add(cmd.toUpperCase(), [].slice.call(arguments, 1));
      _execute(arguments[0]);
      return view;
    }
  });

  view.view(text_or_options);

  return view;
}

window.__ = __;
