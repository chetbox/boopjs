/**
 * Copyright 2015 - Chetan Padia
**/

var chetbot_device = 'my_magic_device_1234567890';
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
        if (result_handler === undefined) {
            result_handler = _log_result;
        }
        var msg = {
            'request':  'UUID_GOES_HERE', // TODO
            'device':   chetbot_device,
            'commands': _commands
        }
        _ws.send(JSON.stringify(msg));
        _ws.onmessage = function(e) {
            _ws.onmessage = unhandled_data;
            var resp = JSON.parse(e.data);
            if (resp.error) {
                console.log(resp.error);
            } else {
                result_handler(resp.result);
            }
        }
    }

    function view() {}

    view.view = function(text_or_options) {
        var args;
        if (typeof(text_or_options) === 'string') {
            args = [text_or_options, null, null];
        } else if (typeof(text_or_options) === 'object' && !!text_or_options) {
            args = [text_or_options.text, text_or_options.type, text_or_options.id];
        } else {
            console.error('Invalid argument', text_or_options);
        }
        _add('VIEW', args);
        return view;
    }
    view.tap = function(handler) {
        _add('TAP');
        _execute(handler);
        return view;
    }
    view.text = function(handler) {
        _add('TEXT');
        _execute(handler);
        return view;
    }

    view.view(text_or_options);

    return view;
}

window.__ = __;
