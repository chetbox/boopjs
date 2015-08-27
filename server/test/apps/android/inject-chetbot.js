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

});
