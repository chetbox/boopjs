var Zip = require('adm-zip');
var fs = require('fs');
var path = require('path');
var mkdir = require('shelljs').mkdir;

exports.extract = function(zip_file, match_fn) {
  var files = {};
  new Zip(zip_file)
  .getEntries()
  .filter(function(entry) {
    return !match_fn || match_fn(entry.entryName);
  })
  .forEach(function(entry) {
    files[entry.entryName] = entry.getData();
  });
  return files;
}

exports.extract_to = function(zip_file, output_dir, match_fn) {
  if (fs.existsSync(output_dir)) {
    throw output_dir + ' already exists';
  }
  mkdir(output_dir);
  var files = exports.extract(zip_file, match_fn);
  Object.keys(files).forEach(function(f) {
    var file_path = path.join(output_dir, f);
    mkdir('-p', path.dirname(file_path));
    fs.writeFileSync(file_path, files[f]);
  });
}

exports.extract_file = function(zip_file, file_name) {
  return exports.extract(zip_file, function(f) {
    return f === file_name;
  })
  [file_name];
};
