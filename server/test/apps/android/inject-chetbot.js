var assert = require('assert');
var path = require('path');
var fs = require('fs');
var tmpdir = require('os').tmpdir;
var zip = require('../../../apps/android/utils/zip');

var MINUTE = 60 * 1000;

describe('Inject ChetBot', function() {

  var inject = require('../../../apps/android/inject-chetbot');

  function contents(file) {
    return fs.readFileSync(file).toString('base64');
  }

  function classes_dex_files(apk_file) {
    return zip.extract(apk_file, function(filename) {
      return filename.match(/classes[0-9]*\.dex/);
    });
  }

  var simple_apk = path.join(__dirname, 'fixtures', 'fruit-android.apk');
  var custom_application_apk = path.join(__dirname, 'fixtures', 'twitter-android.apk');
  var out_apk = path.join(tmpdir(), 'inject-chetbot.test-output.apk');

  afterEach(function() {
    if (fs.existsSync(out_apk)) {
      fs.unlinkSync(out_apk);
    }
  });

  it('Creates a modified APK (Simple app)', function() {
    this.timeout(1 * MINUTE);

    inject.add_chetbot_to_apk(simple_apk, out_apk);

    assert.ok(fs.existsSync(out_apk));
    assert.notEqual(contents(simple_apk), contents(out_apk));

    var dex_files_before = classes_dex_files(simple_apk);
    var dex_files_after = classes_dex_files(out_apk);
    assert.deepEqual(Object.keys(dex_files_before), ['classes.dex']);
    assert.deepEqual(Object.keys(dex_files_after), ['classes.dex', 'classes2.dex']);
    assert.equal(dex_files_before['classes.dex'].toString('base64'), dex_files_after['classes2.dex'].toString('base64'));
  });

  it('Creates a modified APK (App with custom "Application")', function() {
    this.timeout(2 * MINUTE);

    inject.add_chetbot_to_apk(custom_application_apk, out_apk);
    assert.ok(fs.existsSync(out_apk));
    assert.notEqual(contents(custom_application_apk), contents(out_apk));

    var dex_files_before = classes_dex_files(custom_application_apk);
    var dex_files_after = classes_dex_files(out_apk);
    assert.deepEqual(Object.keys(dex_files_before), ['classes.dex']);
    assert.deepEqual(Object.keys(dex_files_after), ['classes.dex', 'classes2.dex']);
    assert.equal(dex_files_before['classes.dex'].toString('base64'), dex_files_after['classes2.dex'].toString('base64'));
  });

});
