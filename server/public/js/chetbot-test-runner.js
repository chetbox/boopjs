var testReportContainerEl = $('#test-report');
var testReportEl = $('#test-report > ol');
var editorContainerEl = $('#editor-container');

function onTestStart(editor) {
  editor.setReadOnly(true);
  testReportEl.empty();
  editorContainerEl
    .addClass('running')
    .removeClass('editing');
}

function onTestStop(editor) {
  editorContainerEl.removeClass('running');
  editor.setReadOnly(false);
}

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

function run(editor, server, device_id) {
  ga('send', 'event', 'button', 'click', 'run');

  onTestStart(editor);

  var statements = esprima.parse(
    editor.getSession().getDocument().getValue(),
    {loc: true}
  ).body.map(function(command) {
    return {
      source: escodegen.generate(command),
      line: command.loc.start.line
    };
  });

  statements.forEach(function(stmt) {
    testReportEl.append(
      $('<li>')
        .addClass('line')
        .addClass('line-' + stmt.line)
        .text(stmt.source)
        .append('<ol>')
    );
  });

  var script = {
    statements: statements,
    name: window.location.pathname.replace(/.*\//, ''),
    device: device_id
  };

  var ws = new WebSocket('ws://' + server + '/api/client');
  function end_test() {
    onTestStop(editor);
    ws.close();
  }
  ws.onopen = function() {
    ws.send(JSON.stringify(script));
  };
  ws.onerror = function(e) {
    console.error(e);
    testReportEl.append(
      $('<li>')
        .addClass('error')
        .text(e.toString())
    )
  };
  ws.onmessage = function(event) {
    var message = JSON.parse(event.data);
    if (message.error && !message.type && !message.line) {
      alert(message.error);
      end_test();
      return;
    }

    if (message.error && message.type === 'uncaught') {
      ga('send', 'event', 'test-step', 'error', message.type);

      testReportEl.append(
        $('<li>')
          .addClass('error')
          .addClass('uncaught')
          .text(message.error)
          .append( $('<pre>').text(message.stacktrace) )
      );

      return;
    }

    var lineEl = testReportEl.find('.line-' + message.line)

    if ('error' in message) {
      ga('send', 'event', 'test-step', 'error', message.type);

      lineEl
        .addClass('error')
        .find('ol')
          .append(
            $('<li>')
              .text(message.error)
              .append( $('<pre>').text(message.stacktrace) )
          );
    } else {
      ga('send', 'event', 'test-step', 'success');
    }

    if ('result' in message) {
      lineEl
        .addClass('success')
        .find('ol')
          .append(resultHTML(message));
    }

    if ('success' in message) {
      ga('send', 'event', 'test-result', message.success ? 'passed' : 'failed');
      testReportEl.append(
        $('<li>')
          .addClass('final-result')
          .addClass(message.success ? 'success' : 'error')
          .text(message.success ? 'Test passed.' : 'Test failed.')
      );

      end_test();
    }

    // TODO: scroll new output into view
  };
}

function showEditor() {
  ga('send', 'event', 'button', 'click', 'show-editor');
  editorContainerEl.addClass('editing');
}

function stop() {
  ga('send', 'event', 'button', 'click', 'stop');
  // TODO
}
