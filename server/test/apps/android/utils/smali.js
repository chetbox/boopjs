var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('Smali utils', function() {

  var smali = require('../../../../apps/android/utils/smali');

  function fixture(relpath) {
    return path.join(__dirname, 'fixtures', relpath);
  }

  function read(file) {
    return fs.readFileSync(file, 'utf-8');
  }

  it('sets the superclass in a smali file', function() {
    assert.equal(
      smali.set_smali_application_class(read(fixture('TwitterApplicationWithCustomApplication.smali')), 'com.domain.CustomApplication'),
      read(fixture('TwitterApplicationWithCustomApplication.smali'))
    );
  });

  it('converts a Java class def. to smali', function() {
    assert.equal(
      smali.smali_class('com.domain.subdomain.Thing'),
      'Lcom/domain/subdomain/Thing;'
    );
  });

  it('converts a smali class def. to Java', function() {
    assert.equal(
      smali.java_class('Lcom/domain/subdomain/Thing;'),
      'com.domain.subdomain.Thing'
    );
  });

  it('gets the path to a smali file for a Java class', function() {
    assert.equal(
      smali.smali_path('com.domain.subdomain.Thing'),
      'com/domain/subdomain/Thing.smali'
    );
  });

  it('finds the superclass from smali src code', function() {
    assert.equal(
      smali.smali_superclass(read(fixture('TwitterApplicationWithCustomApplication.smali'))),
      'Lcom/domain/CustomApplication;'
    );
  });

  it('finds classes required to implment android.app.Application', function() {
    // TODO: test with longer chain of superclasses
    assert.deepEqual(
      smali.classes_implementing_application(fixture('twitter-smali'), 'com.chetbox.twitter.android.TwitterApplication'),
      [
        'com.chetbox.twitter.android.YetAnotherApplication',
        'com.chetbox.twitter.android.TwitterApplication'
      ]
    );
  });

  it('finds classes implementing MultiDexApplication', function() {
    smali.classes_implementing_application(fixture('twitter-multidex-smali'), 'com.chetbox.twitter.android.TwitterApplication'),
    ['com.chetbox.twitter.android.TwitterApplication']
  });

});
