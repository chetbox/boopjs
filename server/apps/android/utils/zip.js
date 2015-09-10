var Zip = require('adm-zip');

exports.extract = function(zip_file, match_fn) {
  var files = {};
  new Zip(zip_file)
  .getEntries()
  .filter(function(entry) {
    return match_fn(entry.entryName);
  })
  .forEach(function(entry) {
    files[entry.entryName] = entry.getData();
  });
  return files;
}

exports.extract_file = function(zip_file, file_name) {
  return exports.extract(zip_file, function(f) {
    return f === file_name;
  })
  [file_name];
};
