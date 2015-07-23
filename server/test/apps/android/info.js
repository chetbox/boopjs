var assert = require('assert');
var path = require('path');

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
    assert.equal(apk_info.icon, 'res/mipmap-xhdpi-v4/ic_launcher.png');
  });

  it('returns the version name', function () {
    assert.equal(apk_info.version, '1.0');
  });
});
