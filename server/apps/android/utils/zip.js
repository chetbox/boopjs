var Zip = require('adm-zip');

exports.extract_file = function(zip_file, file_name) {
  return new Zip(zip_file)
  .getEntries()
  .filter(function(e) {
    return e.entryName == file_name;
  })[0]
  .getData();
};
