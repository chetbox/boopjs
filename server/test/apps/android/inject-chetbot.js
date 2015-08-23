var assert = require('assert');
var path = require('path');
var fs = require('fs');
var shortid = require('shortid');
var xml2js = require('xml2js');

describe('Inject Chetbot (Android)', function() {

  var inject = require('../../../apps/android/inject-chetbot');

  var stopwatch_manifest_default_application = path.join(__dirname, 'fixtures', 'StopwatchManifestDefaultApplication.xml');
  var stopwatch_manifest_custom_application = path.join(__dirname, 'fixtures', 'StopwatchManifestCustomApplication.xml');
  var twitter_application_smali_default_application = path.join(__dirname, 'fixtures', 'twitter-smali', 'com', 'chetbox', 'twitter', 'android', 'TwitterApplication.smali');
  var twitter_application_smali_custom_application = path.join(__dirname, 'fixtures', 'TwitterApplicationWithCustomApplication.smali');
  var twitter_smali_dir = path.join(__dirname, 'fixtures', 'twitter-smali');

  function parseXML(str) {
    var xml;
    xml2js.parseString(str, function(err, parsed_content) {
      // synchronous
      if (err) throw err;
      xml = parsed_content;
    })
    return xml;
  }

  it('sets an application/@android:name AndroidManifest.xml definition', function() {
    assert.deepEqual(
      parseXML(inject.set_manifest_application_class(stopwatch_manifest_default_application, 'com.domain.CustomApplication')),
      parseXML(fs.readFileSync(stopwatch_manifest_custom_application, 'utf-8'))
    );
  });

  it('cannot alter the application/@android:name AndroidManifest.xml definition', function() {
    assert.equal(
      inject.set_manifest_application_class(stopwatch_manifest_custom_application, 'com.domain.SomeOtherApplication'),
      false
    );
  });

  it('sets the superclass in a smali file', function() {
    assert.equal(
      inject.set_smali_application_class(twitter_application_smali_default_application, 'com.domain.CustomApplication'),
      fs.readFileSync(twitter_application_smali_custom_application, 'utf-8')
    );
  });

  it('finds classes extending com.android.Application', function() {
    assert.deepEqual(
      inject.find_application_subclasses(twitter_smali_dir),
      ['com/chetbox/twitter/android/TwitterApplication.smali']
    );
  });

});
