var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Android APK info', function() {

  var info = require('../../../apps/android/info');
  var apk_info = info(path.join(__dirname, 'fixtures', 'stopwatch-debug.apk'));

  it('returns the name', function () {
    assert.equal(apk_info.name, 'Stopwatch');
  });

  it('returns the package name', function () {
    assert.equal(apk_info.identifier, 'com.chetbox.chetbot.stopwatch');
  });

  it('returns the xhdpi icon', function () {
    var expected_icon_begins_with = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimH';
    assert.equal(apk_info.icon.slice(0, 64), expected_icon_begins_with);
  });

  it('returns the version name', function () {
    assert.equal(apk_info.version, '1.0');
  });
});
