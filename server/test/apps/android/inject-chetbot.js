var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Inject Chetbot into Android APK', function() {

  var inject = require('../../../apps/android/inject-chetbot');
  var apk = path.join(__dirname, 'fixtures', 'stopwatch-debug.apk');

  it('find_main_activity finds the launcher activity', function() {
    assert.equal(inject.find_main_activity(apk), 'com.chetbox.chetbot.stopwatch.Stopwatch');
  });

});
