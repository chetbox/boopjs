var consoleContainerEl = $('#console');
var consoleEl = $('#console > ol');
var editorContainerEl = $('#editor-container');

function onTestStart(editor) {
  editor.setReadOnly(true);
  consoleEl.empty();
  editorContainerEl
    .addClass('running')
    .removeClass('editing');
}

function onTestStop(editor) {
  editorContainerEl.removeClass('running');
  editor.setReadOnly(false);
}

function scrollConsoleToBottom() {
  var offset = consoleContainerEl.prop('scrollHeight') - consoleContainerEl.height();
  consoleContainerEl.scrollTop(Math.max(0, offset));
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
        scrollConsoleToBottom();
        return Q(eval(commandStr))
          .then(function(response) {
            consoleEl.children().last().addClass('success');
            consoleEl.append(resultHTML(response));
            scrollConsoleToBottom();
          });
      });
    }, Q(null))
    .then(function() {
      consoleEl.append(
        $('<li>').addClass('final-result').addClass('success').text('Test passed.')
      );
      scrollConsoleToBottom();
    })
    .finally(function() {
      onTestStop(editor);
    })
    .fail(function(e) {
      consoleEl.children().last().addClass('error');
      consoleEl.append(
        $('<li>').addClass('final-result').addClass('error').text(e)
      );
      scrollConsoleToBottom();
      console.error(e);
    });
}

function showEditor() {
  editorContainerEl.addClass('editing');
}

function stop() {
  // TODO
}
