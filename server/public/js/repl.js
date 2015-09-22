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
    repl.gotoLine(line_to_update + 1);
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
    repl.setReadOnly(true);
    $repl.addClass('running');

    var doc = repl.getSession().getDocument();
    var src_to_execute = doc.getLine(doc.getLength() - 1);
    doc.insertLines(doc.getLength(), ['']); // Used for result or next command
    repl.gotoLine(doc.getLength());

    function show_result(r) {
      if (!r.error && (r.result === undefined || r.result === null)) {
        return;
      }

      repl.getSession().addGutterDecoration(doc.getLength() - 1, 'result');
      if (r.error) {
        repl.getSession().addGutterDecoration(doc.getLength() - 1, 'error');
      }

      var message = '// ' + JSON.stringify(r.error ? r.error : r.result);
      doc.insertLines(doc.getLength() - 1, [message]);
      repl.gotoLine(doc.getLength());
    }

    add_to_history(src_to_execute);

    // execute code
    run_script(server, device_id, [{line: 1, source: src_to_execute}], {
      onResult: show_result,
      onError: show_result
    });

    repl.setReadOnly(true);
    setTimeout(function() {
      repl.setReadOnly(false);
      $repl.removeClass('running');
    }, 2000);
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
