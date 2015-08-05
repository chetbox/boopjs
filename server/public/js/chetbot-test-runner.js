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
    el.text(JSON.stringify(response.result));
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
  ws.onopen = function() {
    ws.send(JSON.stringify(script));
  };
  ws.onerror = function(e) {
    console.error(error);
    testReportEl.append(
      $('<li>')
        .addClass('error')
        .text(e.toString())
    )
  };
  ws.onmessage = function(event) {
    var message = JSON.parse(event.data);
    if (!message.line) {
      alert(message.error);
      return;
    }

    var lineEl = testReportEl.find('.line-' + message.line)

    if (message.error) {
      ga('send', 'event', 'test-step', 'error');

      lineEl
        .addClass('error')
        .find('ol')
          .append( $('<li>').text(message.error) );
    } else {
      ga('send', 'event', 'test-step', 'success');
    }

    if (message.hasOwnProperty('result')) {
      lineEl
        .addClass('success')
        .find('ol')
          .append(resultHTML(message));
    }

    // TODO: scroll new output into view
  };

  // TODO: final 'Test passed/failed' message

  // ga('send', 'event', 'test-result', 'passed');
  // testReportEl.append(
  //   $('<li>').addClass('final-result').addClass('success').text('Test passed.')
  // );

  // ga('send', 'event', 'test-result', 'failed', '' + errorString;
  // testReportEl.append(
  //   $('<li>').addClass('final-result').addClass('error').text(e)
  // );

  // TODO only when the test is complete
  onTestStop(editor);

  // TODO: disconnect from websocket
}

function showEditor() {
  ga('send', 'event', 'button', 'click', 'show-editor');
  editorContainerEl.addClass('editing');
}

function stop() {
  ga('send', 'event', 'button', 'click', 'stop');
  // TODO
}
