var SAVE_AFTER_MS = 1000;
var save_timeout = false;

function save(editor) {
  if (save_timeout) {
    clearTimeout(save_timeout);
  }
  save_timeout = setTimeout(function() {
    console.log('Saving');
    var code = editor.getSession().getDocument().getValue();
    save_timeout = null;
    $.ajax(location.pathname + '/code', {
      method: 'PUT',
      contentType: 'text/plain; charset=UTF-8',
      data: code,
      beforeSend: function() {
        $('body')
          .removeClass('save-error')
          .addClass('saving');
      },
      success: function() {
        $('body').removeClass('saving');
      },
      error: function(e) {
        $('body').addClass('save-error');

        // Try saving again
        setTimeout(function() { save(editor); }, 5000);
      }
    });
  }, SAVE_AFTER_MS);
}

function autosave(editor) {
  editor.on('change', function() { save(editor); });
}
