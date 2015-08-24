var assert = require('assert');
var path = require('path');
var fs = require('fs');
var shortid = require('shortid');
var xml2js = require('xml2js');

describe('Inject Chetbot (Android)', function() {

  var inject = require('../../../apps/android/inject-chetbot');

  function fixture(relpath) {
    return path.join(__dirname, 'fixtures', relpath);
  }

  function parseXML(str) {
    var xml;
    xml2js.parseString(str, function(err, parsed_content) {
      // synchronous
      if (err) throw err;
      xml = parsed_content;
    })
    return xml;
  }

  function read(file) {
    return fs.readFileSync(file, 'utf-8');
  }

  it('gets application/@android:name AndroidManifest.xml definition', function() {
    assert.equal(
      inject.get_manifest_application_class(parseXML(read(fixture('StopwatchManifestCustomApplication.xml')))),
      'com.domain.CustomApplication'
    );
  });

  it('cannot get application/@android:name AndroidManifest.xml definition if not defined', function() {
    assert.equal(
      inject.get_manifest_application_class(parseXML(read(fixture('StopwatchManifestDefaultApplication.xml')))),
      undefined
    );
  });

  it('sets an application/@android:name AndroidManifest.xml definition', function() {
    var manifest = parseXML(read(fixture('StopwatchManifestDefaultApplication.xml')));
    inject.set_manifest_application_class(manifest, 'com.domain.CustomApplication');
    assert.deepEqual(
      manifest,
      parseXML(read(fixture('StopwatchManifestCustomApplication.xml')))
    );
  });

  it('sets the superclass in a smali file', function() {
    assert.equal(
      inject.set_smali_application_class(read(fixture('TwitterApplicationWithCustomApplication.smali')), 'com.domain.CustomApplication'),
      read(fixture('TwitterApplicationWithCustomApplication.smali'))
    );
  });

  it('converts a Java class def. to smali', function() {
    assert.equal(
      inject.smali_class('com.domain.subdomain.Thing'),
      'Lcom/domain/subdomain/Thing;'
    );
  });

  it('converts a smali class def. to Java', function() {
    assert.equal(
      inject.java_class('Lcom/domain/subdomain/Thing;'),
      'com.domain.subdomain.Thing'
    );
  });

  it('gets the path to a smali file for a Java class', function() {
    assert.equal(
      inject.smali_path('com.domain.subdomain.Thing'),
      'com/domain/subdomain/Thing.smali'
    );
  });

  it('finds the superclass from smali src code', function() {
    assert.equal(
      inject.smali_superclass(read(fixture('TwitterApplicationWithCustomApplication.smali'))),
      'Lcom/domain/CustomApplication;'
    );
  });

  it('finds classes required to implment android.app.Application', function() {
    // TODO: test with longer chain of superclasses
    assert.deepEqual(
      inject.classes_implementing_application(fixture('twitter-smali'), 'com.chetbox.twitter.android.TwitterApplication'),
      [
        'com.chetbox.twitter.android.YetAnotherApplication',
        'com.chetbox.twitter.android.TwitterApplication'
      ]
    );
  });

  it('finds classes implementing MultiDexApplication', function() {
    inject.classes_implementing_application(fixture('twitter-multidex-smali'), 'com.chetbox.twitter.android.TwitterApplication'),
    ['com.chetbox.twitter.android.TwitterApplication']
  });

});
