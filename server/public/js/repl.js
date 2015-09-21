function setup_repl(server, device_id, id) {
  $repl = $('#' + id);

  var repl = ace.edit(id);
  repl.setTheme('ace/theme/tomorrow_night_eighties');
  repl.getSession().setMode('ace/mode/javascript');
  repl.setOptions({
    enableLiveAutocompletion: true,
    enableSnippets: false
  });

  $repl.keydown(function(e) {
    if (e.which == 13 /* Return */) {
      e.preventDefault();
      if (repl.getReadOnly()) {
        // Still running
        return;
      }

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
  });

  return repl;
}
