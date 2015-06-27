var consoleEl = $('#console');
var consoleOutputEl = $('#console > ol');
var editorContainerEl = $('#editor-container');

function onTestStart(editor) {
  editor.setReadOnly(true);
  consoleOutputEl.empty();
  editorContainerEl.removeClass('editing');
}

function onTestStop(editor) {
  editor.setReadOnly(false);
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
        consoleOutputEl.append(
          $('<li>').text(commandStr)
        );
        return Q(eval(commandStr))
          .then(function(result) {
            consoleOutputEl.children().last().addClass('success');
          });
      });
    }, Q(null))
    .then(function() {
      consoleEl.append(
        $('<p>').addClass('success').text('Test passed.')
      );
    })
    .finally(function() {
      onTestStop(editor);
    })
    .fail(function(e) {
      consoleOutputEl.children().last().addClass('error');
      consoleEl.append(
        $('<p>').addClass('error').text('Test failed.')
      );
      console.error(e);
    });
}
