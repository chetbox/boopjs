function setup_repl(server, device_id, id, callbacks) {
  $repl = $('#' + id);

  var repl = ace.edit(id);
  repl.setTheme('ace/theme/tomorrow_night_eighties');
  repl.getSession().setMode('ace/mode/javascript');
  repl.setOptions({
    enableLiveAutocompletion: true,
    enableSnippets: false
  });
  repl.$blockScrolling = Infinity

  var history = [];
  var history_cursor = history.length;
  var pending = 0;

  function show_from_history(new_cursor_value) {
    if (new_cursor_value < 0) return;
    if (new_cursor_value > history.length) return;
    history_cursor = new_cursor_value;
    var doc = repl.getSession().getDocument();
    var line_to_update = doc.getLength() - 1;
    var new_line = history[history_cursor];
    if (line_to_update === 0) {
      doc.setValue(new_line);
    } else {
      doc.removeLines(line_to_update, line_to_update);
      doc.insertLines(line_to_update, [new_line]);
    }
    repl.gotoLine(line_to_update + 1, Number.MAX_SAFE_INTEGER, false);
  }

  function add_to_history(line) {
    if (history.length > 0 && history[history.length - 1] === line) {
      // Same as the last line, do not add
    } else {
      history.push(line);
    }
    history_cursor = history.length;
  }

  function run() {
    $repl.addClass('running');
    pending++;

    var doc = repl.getSession().getDocument();
    var src_to_execute = doc.getLine(doc.getLength() - 1);
    doc.insertLines(doc.getLength(), ['']); // Used for result or next command
    repl.gotoLine(doc.getLength());

    function show_result(result_key, decorate_gutter, prefix) {
      if (typeof(decorate_gutter) === 'string') {
        var decoration = decorate_gutter;
        decorate_gutter = function() { return decoration; }
      }
      if (!prefix) prefix = '';
      return function(r) {
        pending--;
        if (!pending) {
          $repl.removeClass('running');
        }

        if ('error' in r) {
          console.warn(r.error, r.stacktrace);
        }
        var result = r[result_key];
        if (result_key === 'result' && (result === undefined || result === null)) {
          // Don't show empty results
          return;
        }

        if (result_key === 'log' && result.length === 1) {
          result = result[0];
        }

        var message_lines = JSON.stringify(result, null, 2)
          .split('\n')
          .map(function(line) { return prefix + line; });
        var start_line = doc.getLength() - 1;
        doc.insertLines(start_line, message_lines);
        // See repl.css for gutter decorations
        for (var i = start_line; i < doc.getLength() - 1; i++) {
          repl.getSession().addGutterDecoration(i, decorate_gutter(r));
        }
        repl.gotoLine(doc.getLength());
      }
    }

    add_to_history(src_to_execute);

    // execute code
    run_script(server, device_id, [{line: 1, source: src_to_execute}], {
      onResult: show_result('result', 'result', '// '),
      onError: show_result('error', 'error', '// Error: '),
      onLogMessage: show_result('log', function(msg) { return msg.level; }, '// ')
    });
  }

  repl.commands.addCommands([
    {
      name: 'Close',
      bindKey: 'Esc',
      exec: callbacks && callbacks.onClose
    }, {
      name: 'Run',
      bindKey: 'Return',
      exec: function() {
        if (!repl.getReadOnly()) {
          run();
        }
      }
    }, {
      name: 'Previous command',
      bindKey: 'Up',
      exec: function() {
        if (!repl.getReadOnly()) {
          show_from_history(history_cursor - 1);
        }
      }
    }, {
      name: 'Next command',
      bindKey: 'Down',
      exec: function() {
        if (!repl.getReadOnly()) {
          show_from_history(history_cursor + 1);
        }
      }
    }, {
      name: 'Page up (disabled)',
      bindKey: 'PageUp',
      exec: function() {}
    }, {
      name: 'Page down (disabled)',
      bindKey: 'PageDown',
      exec: function() {}
    }
  ]);

  return repl;
}
