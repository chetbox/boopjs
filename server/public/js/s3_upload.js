function s3_upload(file_input, target_input, opts) {

  function ga(a,b,c,d,e) {
    if (opts.ga) { return opts.google_analytics(a,b,c,d,e); }
  }

  function progress(msg) {
    if (opts.progress) { opts.progress(msg); }
  }

  function error(msg) {
    if (opts.error) { opts.error(msg); }
  }

  $(file_input).on('change', function(e) {
    ga('send', 'event', 'app-upload', 'start');

    $(e.target).hide();

    progress('Requesting upload...');

    var file = e.target.files[0];
    if (!file) {
      $(target_input).val('');
      ga('send', 'event', 'app-upload', 'no-file');
      return;
    }

    $.ajax({
      url: '/sign_s3?file_type=' + file.type,
      method: 'GET',
      dataType: 'json'
    }).done(function(req) {
      ga('send', 'event', 'app-upload', 'request-granted');
      progress('Uploading...');
      var xhr = new XMLHttpRequest();
      xhr.upload.onprogress = function(e) {
        var percent_complete = Math.floor(e.loaded / e.total * 100);
        progress(percent_complete + '% complete...');
      };
      xhr.onload = function() {
        if (xhr.status === 200) {
          ga('send', 'event', 'app-upload', 'uploaded');

          progress('Done. Redirecting...');
          $(target_input).val(req.url);
          $(target_input).closest('form').submit();
        } else {
          ga('send', 'event', 'app-upload', 'upload-error', xhr.responseText);
          error('Error ' + xhr.status + ': ' + xhr.responseText);
          console.error(xhr.status, xhr.responseText);
        }
      };
      xhr.onerror = function(e) {
        ga('send', 'event', 'app-upload', 'upload-error', xhr.responseText);
        error('Upload error: ' + xhr.responseText);
        console.error(xhr.responseText, e);
      };
      xhr.open('PUT', req.signed_request);
      xhr.send(file);
    });
  });
}
