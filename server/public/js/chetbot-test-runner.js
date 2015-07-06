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
          href: 'data:image/png;base64,' + response.result
        })
        .append(
          $('<img>')
            .attr('src', 'data:image/png;base64,' + response.result)
        )
    );
  } else {
    el.text(JSON.stringify(response.result));
  }
  return el;
}

function run(editor) {
  ga('send', 'event', 'button', 'click', 'run');

  onTestStart(editor);

  var script = esprima.parse(
    editor.getSession().getDocument().getValue(),
    {loc: true}
  );

  script.body
    .reduce(function(previous_promise, command) {
      return previous_promise.then(function() {
        var commandStr = escodegen.generate(command);
        testReportEl.append(
          $('<li>').text(commandStr)
        );
        scrolltestReportToBottom();
        return Q(eval(commandStr))
          .then(function(response) {
            testReportEl.children().last().addClass('success');
            testReportEl.append(resultHTML(response));
            scrolltestReportToBottom();
          });
      });
    }, Q(null))
    .then(function() {
      ga('send', 'event', 'test-result', 'passed');
      testReportEl.append(
        $('<li>').addClass('final-result').addClass('success').text('Test passed.')
      );
      scrolltestReportToBottom();
    })
    .finally(function() {
      onTestStop(editor);
    })
    .fail(function(e) {
      ga('send', 'event', 'test-result', 'failed', '' + e.toString());
      testReportEl.children().last().addClass('error');
      testReportEl.append(
        $('<li>').addClass('final-result').addClass('error').text(e)
      );
      scrolltestReportToBottom();
      console.error(e);
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
