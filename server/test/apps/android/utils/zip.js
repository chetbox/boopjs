var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Zip utils', function() {

  var zip_utils = require('../../../../apps/android/utils/zip');
  var apk = path.join(__dirname, '..', 'fixtures', 'stopwatch-debug.apk');
  var mdpi_icon = fs.readFileSync(path.join(__dirname, 'fixtures', 'ic_launcher-mdpi.png'));

  it('"extract" extracts files matching a filter', function() {
    var launcher_icons = zip_utils.extract(apk, function(file_path) {
      return file_path.match(/res\/mipmap-mdpi.*\/ic_launcher\.png/);
    });
    // convert to base64 for comparison
    Object.keys(launcher_icons).forEach(function(file_path) {
      launcher_icons[file_path] = launcher_icons[file_path].toString('base64');
    });
    assert.deepEqual(launcher_icons, {
      'res/mipmap-mdpi-v4/ic_launcher.png': mdpi_icon.toString('base64')
    });
  });

  it('"extract_file" extracts the contents of a file in the archive', function() {
    var extracted_icon = zip_utils.extract_file(apk, 'res/mipmap-mdpi-v4/ic_launcher.png');
    assert.equal(extracted_icon.toString('base64'), mdpi_icon.toString('base64'));
  });

});
