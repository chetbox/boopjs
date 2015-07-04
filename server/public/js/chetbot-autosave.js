var SAVE_AFTER_MS = 3000;
var save_timeout = false;

function save(editor) {
  if (save_timeout) {
    clearTimeout(save_timeout);
  }
  save_timeout = setTimeout(function() {
    console.log('Saving');
    var code = editor.getSession().getDocument().getValue();
    save_timeout = null;
    $.ajax(window.location.pathname + '/code', {
      method: 'PUT',
      mimeType: 'text/javascript',
      data: code
    });
  }, SAVE_AFTER_MS);
}

function autosave(editor) {
  editor.on('change', function() { save(editor); });
}
