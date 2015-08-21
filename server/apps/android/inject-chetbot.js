var os = require('os');
var fs = require('fs');
var path = require('path');
var shortid = require('shortid');
var zip_utils = require('./zip-utils');
var xml2js = require('xml2js');

require('./tools').global();
require('shelljs/global');
config.silent = true;

function get_output(exec_obj) {
  check_succeeds(exec_obj);
  return exec_obj.output;
}

function user_home() {
  return process.env.HOME || process.env.USERPROFILE;
}

function tmp_dir() {
  var dir = path.join(os.tmpdir(), 'chetbot.inject', shortid.generate());
  return function(file) {
    return file ? path.join(dir, file) : dir;
  }
}

function set_application_class(manifest_file, application_class) {
  var manifest;
  xml2js.parseString(fs.readFileSync(manifest_file), function(err, xml) {
    // parseString is synchronous by default
    manifest = xml;
  });

  if (manifest.manifest.application[0]['$']['android:name']) {
    throw 'Apps with a custom Application class are not yet supported';
  }
  manifest.manifest.application[0]['$']['android:name'] = application_class;

  var xml_builder = new xml2js.Builder();
  fs.writeFileSync(manifest_file, xml_builder.buildObject(manifest));
}

exports.add_chetbot_to_apk = function(input_apk, output_apk) {

  output_apk = output_apk || input_apk;

  var android_debug_keystore = path.join(user_home(), '.android', 'debug.keystore');

  var tmp = tmp_dir();

  rm('-rf', tmp()); // make sure there's no junk lying around
  mkdir('-p', tmp());

  console.log('Copying APK');
  console.log('  ' + input_apk);
  cp(input_apk, tmp('app.apk'));

  console.log('Extracting resources from APK');
  java('-jar', apktool, 'decode', '--no-src', tmp('app.apk'), '-o', tmp('app'));

  console.log('Modifying AndroidManifest.xml');
  set_application_class(tmp('app/AndroidManifest.xml'), 'com.chetbox.chetbot.android.ChetbotApplication');

  console.log('Shuffling classes?.dex files');
  var dex_files = ls(tmp('app'))
    .filter(function(f) { return f.match(/classes[0-9]*\.dex/); })
    .sort();
  mv(tmp('app/classes.dex'), tmp('app/classes' + (dex_files.length + 1) + '.dex'));

  console.log('Adding Chetbot dex');
  cp(chetbot_dex, tmp('app'));

  console.log('Re-packaging APK');
  java('-jar', apktool, '-o', tmp('app.chetbot.apk'), 'build', tmp('app'));

  console.log('Signing');
  jarsigner(
      '-digestalg', 'SHA1',
      '-sigalg', 'MD5withRSA',
      '-keystore', android_debug_keystore,
      '-storepass', 'android',
      '-keypass', 'android',
      tmp('app.chetbot.apk'),
      'androiddebugkey'
  );
  jarsigner('-verify', '-certs', tmp('app.chetbot.apk'));

  console.log('Zip-aligning');
  zipalign('4', tmp('app.chetbot.apk'), tmp('app-aligned.chetbot.apk'));

  console.log('Copying APK to destination');
  console.log('  -> ' + output_apk);
  mv('-f', tmp('app-aligned.chetbot.apk'), output_apk);

  console.log('Cleaning up');
  rm('-r', tmp());

  return output_apk;
}
