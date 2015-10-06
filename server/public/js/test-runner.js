var testReportContainerEl = $('#test-report');
var testReportEl = $('#test-report > ol');
var editorContainerEl = $('#editor-container');

function scrolltestReportToBottom() {
  var offset = testReportContainerEl.prop('scrollHeight') - testReportContainerEl.height();
  testReportContainerEl.scrollTop(Math.max(0, offset));
}

function resultHTML(response) {
  if (!response) {
    return $('<li>')
      .addClass('result')
      .addClass('none');
  }
  var el = $('<li>')
    .addClass('result')
    .addClass(response.type.toLowerCase());
  if (response.type === 'NULL') {
    // don't show anything
  } else if (response.type === 'BITMAP') {
    el.append(
      $('<a>')
        .attr({
          target: '_blank',
          href: response.result
        })
        .append(
          $('<img>')
            .attr('src', response.result)
        )
    );
  } else {
    el.text(JSON.stringify(response.result, null, 2));
  }
  return el;
}

function errorHTML(message) {
  return $('<li>')
    .addClass('error')
    .addClass(message.type)
    .text(message.error)
    .append( $('<pre>').text(message.stacktrace) );
}

function run_test(editor, server, device_id) {
  ga('send', 'event', 'button', 'click', 'run');

  var statements = esprima.parse(
    editor.getSession().getDocument().getValue(),
    {loc: true}
  ).body.map(function(command) {
    return {
      source: escodegen.generate(command),
      line: command.loc.start.line
    };
  });

  run_script(server, device_id, statements, {
    beforeStart: function(statements) {
      testReportEl.empty();
      statements.forEach(function(stmt) {
        testReportEl.append(
          $('<li>')
            .addClass('line')
            .addClass('line-' + stmt.line)
            .text(stmt.source)
            .append('<ol>')
        );
      });
    },
    onStart: function() {
      editor.setReadOnly(true);
      editorContainerEl
        .addClass('running')
        .removeClass('editing');
    },
    onFinish: function() {
      editorContainerEl.removeClass('running');
      editor.setReadOnly(false);
    },
    onResult: function(message) {
      ga('send', 'event', 'test-step', 'result', message.error ? 'error' : 'success');

      testReportEl.find('.line-' + message.line)
        .addClass(message.error ? 'error' : 'success')
        .find('ol')
        .append(message.error
          ? errorHTML(message)
          : resultHTML(message)
        );

      // TODO: scroll new output into view
    },
    onSuccess: function(message) {
      ga('send', 'event', 'test-result', message.success ? 'passed' : 'failed');

      testReportEl.append(
        $('<li>')
          .addClass('final-result')
          .addClass(message.success ? 'success' : 'error')
          .text(message.success ? 'Test passed.' : 'Test failed.')
      );
    },
    onError: function(message) {
      ga('send', 'event', 'test-result', 'error', message.type);

      testReportEl.append(errorHTML(message));
    }
  });
}

function showEditor() {
  ga('send', 'event', 'button', 'click', 'show-editor');
  editorContainerEl.addClass('editing');
}

function stop() {
  ga('send', 'event', 'button', 'click', 'stop');
  // TODO
}
