function s3_upload(file_input, target_input, opts) {

  function ga(a,b,c,d,e) {
    if (opts.google_analytics) { return opts.google_analytics(a,b,c,d,e); }
  }

  function click() {
    if (opts.click) { opts.click(); }
  }

  function change(file) {
    if (opts.change) { opts.change(file); }
  }

  function progress(msg) {
    if (opts.progress) { opts.progress(msg); }
  }

  function error(msg) {
    if (opts.error) { opts.error(msg); }
  }

  function success(response) {
    if (opts.success) { opts.success(response); }
  }

  $(file_input)
  .on('click', click)
  .on('change', function(e) {
    ga('send', 'event', 'app-upload', 'start');

    $(e.target).hide();

    progress('Requesting upload...');

    var file = e.target.files[0];

    change(file);

    if (!file) {
      $(target_input).val('');
      ga('send', 'event', 'app-upload', 'no-file');
      return;
    }

    $.ajax({
      url: '/api/v1/s3/sign_upload?file_type=' + file.type,
      method: 'POST',
      dataType: 'json',
      error: function(xhr) {
        console.error(xhr);
        error('Error ' + xhr.status + ': ' + xhr.responseText);
      }
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

          progress('Processing...');
          $(target_input).val(req.url);

          var $form = $(target_input).closest('form');
          $.ajax({
            url: $form.attr('action') || location.pathname,
            method: $form.attr('method'),
            data: { s3_bucket: req.s3_bucket, s3_path: req.s3_path },
            success: function(data) {
              progress('Done.');
              success(data);
            },
            error: function(xhr) {
              console.error(xhr);
              error('Error ' + xhr.status + ': ' + xhr.responseText);
            }
          });
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
