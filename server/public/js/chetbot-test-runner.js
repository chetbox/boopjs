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
      testReportEl.append(
        $('<li>').addClass('final-result').addClass('success').text('Test passed.')
      );
      scrolltestReportToBottom();
    })
    .finally(function() {
      onTestStop(editor);
    })
    .fail(function(e) {
      testReportEl.children().last().addClass('error');
      testReportEl.append(
        $('<li>').addClass('final-result').addClass('error').text(e)
      );
      scrolltestReportToBottom();
      testReport.error(e);
    });
}

function showEditor() {
  editorContainerEl.addClass('editing');
}

function stop() {
  // TODO
}
