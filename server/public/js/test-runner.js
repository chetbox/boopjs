var testReportContainerEl = $('#test-report');
var testReportEl = $('#test-report > ol');
var editorContainerEl = $('#editor-container');

function scrolltestReportToBottom() {
  var offset = testReportContainerEl.prop('scrollHeight') - testReportContainerEl.height();
  testReportContainerEl.scrollTop(Math.max(0, offset));
}

function resultHTML(response, result_key) {
  console.log(response)
  var el = $('<li>')
    .addClass(result_key)
    .addClass(response.level) // for log messages

  var result = response[result_key];
  if (response.type === 'NULL' || !response[result_key]) {
    // (response.type === 'NULL') is an old-style response
    return el.addClass('none');
  }
  if (response.type === 'BITMAP') {
    // Old style responses {"type": "BITMAP", result_key: "data:..."}
    return el.addClass('bitmap').append(
      $('<a>')
        .attr({
          target: '_blank',
          href: result
        })
        .append(
          $('<img>')
            .attr('src', result)
        )
    );
  }
  if (result.type === 'BITMAP') {
    // New style responses {result_key: {"type": "BITMAP", "uri": "data:..."}}
    return el.addClass('bitmap').append(
      $('<a>')
        .attr({
          target: '_blank',
          href: result.uri
        })
        .append(
          $('<img>')
            .attr('src', result.uri)
        )
    );
  }
  return el.text(JSON.stringify(result, null, 2));
}

function errorHTML(message) {
  return $('<li>')
    .addClass('error')
    .addClass(message.type)
    .text(message.error)
    .append( $('<pre>').text(message.stacktrace) );
}

function run_test(source, server, device_id, app_id, code_id, started_at) {
  ga('send', 'event', 'button', 'click', 'run');

  var statements = esprima.parse(
    source,
    {loc: true}
  ).body.map(function(command) {
    return {
      source: escodegen.generate(command),
      line: command.loc.start.line
    };
  });
  var scripts = [{
    id: code_id,
    statements: statements
  }]

  function result_container(message) {
    $run = testReportEl.last('.run');
    return message.location
      ? $run.find('.script-' + message.location.script + '-line-' + message.location.line + ' > ol')
      : $run;
  }

  run_script(server, device_id, app_id, code_id, started_at, scripts, {
    beforeStart: function() {
      testReportEl.children('.run').hide();
      $run = $('<li>').addClass('run').appendTo(testReportEl);
      scripts.forEach(function(script, script_index) {
        $lines = $('<ol>').addClass('lines');
        $run.append(
          $('<h3>').text(script.name || script.id),
          $lines
        );
        statements.forEach(function(stmt) {
          $lines.append(
            $('<li>')
              .addClass('line')
              .addClass('script-' + script_index + '-line-' + stmt.line)
              .text(stmt.source)
              .append('<ol>')
          );
        });
      });
    },
    onStart: function() {
      editorContainerEl
        .addClass('running')
        .removeClass('editing');
    },
    onFinish: function() {
      editorContainerEl.removeClass('running');
    },
    onResult: function(message) {
      ga('send', 'event', 'test-step', 'result', message.error ? 'error' : 'success');

      result_container(message)
        .append(message.error
          ? errorHTML(message)
          : resultHTML(message, 'result')
        )
        .parent()
          .addClass(message.error ? 'error' : 'success');

      // TODO: scroll new output into view
    },
    onLogMessage: function(message) {
      ga('send', 'event', 'log-message', message.level);

      result_container(message).append( resultHTML(message, 'log') );
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
      ga('send', 'event', 'test-error', message.type, message.error);

      result_container(message)
        .append(errorHTML(message))
        .parents('.line')
          .addClass('error');
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
