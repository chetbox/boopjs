function rename(url, current_name, update_el) {
  current_name = current_name || $(update_el).not('title').first().text();
  var new_name = prompt('Rename "' + current_name + '" to:', current_name);
  if (!new_name) {
    return;
  }

  $.ajax(url + '/name', {
    method: 'PUT',
    contentType: 'text/plain; charset=UTF-8',
    data: new_name,
  }).done(function() {
    if (update_el) {
      $(update_el).text(new_name);
    } else {
      location.reload();
    }
  })
}
