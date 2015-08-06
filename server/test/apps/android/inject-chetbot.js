var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Inject Chetbot into Android APK', function() {

  var inject = require('../../../apps/android/inject-chetbot');

  var stopwatch_apk = path.join(__dirname, 'fixtures', 'stopwatch-debug.apk');
  var mubi_apk = path.join(__dirname, 'fixtures', 'com.mubi.apk');
  var myapp_smali = fs.readFileSync(path.join(__dirname, 'fixtures', 'myapp-smali', 'myapp', 'MyMainActivity.smali'));
  var myapp_smali_with_chetbot = String(fs.readFileSync(path.join(__dirname, 'fixtures', 'myapp-chetbot-smali', 'myapp', 'MyMainActivity.smali')));

  it('finds the launcher <activity>', function() {
    assert.equal(
      inject.find_main_activity(stopwatch_apk),
      'com.chetbox.chetbot.stopwatch.Stopwatch'
    );
  });

  it('finds the launcher <activity-alias>', function() {
    assert.equal(
      inject.find_main_activity(mubi_apk),
      'com.mubi.browse.BrowseActivity'
    );
  });

  it('injects "Chetbot.start(...)" smali into onCreate', function() {
    assert.equal(
      inject.add_chetbot_to_oncreate(myapp_smali),
      myapp_smali_with_chetbot
    );
  });

});
