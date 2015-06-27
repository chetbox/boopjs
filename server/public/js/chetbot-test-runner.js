var consoleEl = $('#console > ol');
var editorContainerEl = $('#editor-container');

function onTestStart(editor) {
  editor.setReadOnly(true);
  consoleEl.empty();
  editorContainerEl.removeClass('editing');
}

function onTestStop(editor) {
  editor.setReadOnly(false);
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
    el.css('background-image', 'url(data:image/png;base64,' + response.result + ')')
      .click(function() {
        window.open('data:image/png;base64,' + response.result);
      });
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
        consoleEl.append(
          $('<li>').text(commandStr)
        );
        return Q(eval(commandStr))
          .then(function(response) {
            consoleEl.children().last().addClass('success');
            consoleEl.append(resultHTML(response));
          });
      });
    }, Q(null))
    .then(function() {
      consoleEl.append(
        $('<li>').addClass('final-result').addClass('success').text('Test passed.')
      );
    })
    .finally(function() {
      onTestStop(editor);
    })
    .fail(function(e) {
      consoleEl.children().last().addClass('error');
      consoleEl.append(
        $('<li>').addClass('final-result').addClass('error').text(e)
      );
      console.error(e);
    });
}
