var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Zip utils', function() {

  var zip_utils = require('../../../apps/android/zip-utils');
  var apk = path.join(__dirname, 'fixtures', 'stopwatch-debug.apk');
  var mdpi_icon = fs.readFileSync(path.join(__dirname, 'fixtures', 'ic_launcher-mdpi.png'));

  it('extract_file extracts the contents of a file in the archive', function() {
    var extracted_icon = zip_utils.extract_file(apk, 'res/mipmap-mdpi-v4/ic_launcher.png');
    assert.equal(extracted_icon.toString('base64'), mdpi_icon.toString('base64'));
  });

});
