var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Zip utils', function() {

  var zip_utils = require('../../../../apps/android/utils/zip');
  var apk = path.join(__dirname, '..', 'fixtures', 'stopwatch-debug.apk');
  var mdpi_icon = fs.readFileSync(path.join(__dirname, 'fixtures', 'ic_launcher-mdpi.png'));

  it('"extract" extracts files matching a filter', function() {
    var launcher_icons = zip_utils.extract(apk, function(file_path) {
      return file_path.match(/ic_launcher\.png/);
    })
    .map(function(entry) {
      return entry.entryName;
    });
    assert.deepEqual(launcher_icons, [
      'res/mipmap-hdpi-v4/ic_launcher.png',
      'res/mipmap-mdpi-v4/ic_launcher.png',
      'res/mipmap-xhdpi-v4/ic_launcher.png',
      'res/mipmap-xxhdpi-v4/ic_launcher.png'
    ]);
  });

  it('"extract_file" extracts the contents of a file in the archive', function() {
    var extracted_icon = zip_utils.extract_file(apk, 'res/mipmap-mdpi-v4/ic_launcher.png');
    assert.equal(extracted_icon.toString('base64'), mdpi_icon.toString('base64'));
  });

});
