var assert = require('assert');
var path = require('path');
var fs = require('fs');
var shortid = require('shortid');
var xml2js = require('xml2js');

describe('XML utils', function() {

  var xml = require('../../../../apps/android/utils/xml');

  function fixture(relpath) {
    return path.join(__dirname, '..', 'fixtures', relpath);
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

  it('parses XML', function() {
    assert.deepEqual(
      xml.parseXML('<manifest first="one"></manifest>'),
      {manifest: {'$': {'first': 'one'}}}
    );
  });

  it('gets application/@android:name AndroidManifest.xml definition', function() {
    assert.equal(
      xml.get_manifest_application_class(parseXML(read(fixture('StopwatchManifestCustomApplication.xml')))),
      'com.domain.CustomApplication'
    );
  });

  it('cannot get application/@android:name AndroidManifest.xml definition if not defined', function() {
    assert.equal(
      xml.get_manifest_application_class(parseXML(read(fixture('StopwatchManifestDefaultApplication.xml')))),
      undefined
    );
  });

  it('sets an application/@android:name AndroidManifest.xml definition', function() {
    var manifest = parseXML(read(fixture('StopwatchManifestDefaultApplication.xml')));
    xml.set_manifest_application_class(manifest, 'com.domain.CustomApplication');
    assert.deepEqual(
      manifest,
      parseXML(read(fixture('StopwatchManifestCustomApplication.xml')))
    );
  });

  describe('add_permission', function() {

    it('adds permssion to AndroidManifest.xml', function() {
      var manifest = parseXML(read(fixture('StopwatchManifestDefaultApplication.xml')));
      xml.add_permission('android.permission.ACCESS_FINE_LOCATION', manifest);
      assert.deepEqual(
        manifest,
        parseXML(read(fixture('StopwatchManifestWithLocationPermission.xml')))
      );
    });

    it('does not add permssion that already exists in AndroidManifest.xml', function() {
      var manifest = parseXML(read(fixture('StopwatchManifestWithLocationPermission.xml')));
      xml.add_permission('android.permission.ACCESS_FINE_LOCATION', manifest);
      assert.deepEqual(
        manifest,
        parseXML(read(fixture('StopwatchManifestWithLocationPermission.xml')))
      );
    });

  });

});
