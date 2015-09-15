var os = require('os');
var fs = require('fs');
var path = require('path');
var shortid = require('shortid');
var yaml = require('js-yaml');
var walk = require('fs-walk').walkSync;

var xml_utils = require('./utils/xml');
var smali_utils = require('./utils/smali');

var CHETBOT_APPLICATION_CLASS = 'lgzmrmbhly.com.chetbox.chetbot.android.ChetbotApplication';

require('shelljs/global');
require('./tools').global();
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

exports.add_chetbot_to_apk = function(input_apk, output_apk) {

  output_apk = output_apk || input_apk;

  var android_debug_keystore = path.join(user_home(), '.android', 'debug.keystore');

  var tmp = tmp_dir();

  rm('-rf', tmp()); // make sure there's no junk lying around
  mkdir('-p', tmp());

  console.log('Copying APK: ' + input_apk);
  cp(input_apk, tmp('app.apk'));

  console.log('Extracting resources from APK');
  java('-Xmx1024m', '-jar', apktool, 'decode', '--no-src', tmp('app.apk'), '-o', tmp('app'));

  console.log('Attempting to set custom Application in AndroidManifest.xml');
  var manifest = xml_utils.parseXML(fs.readFileSync(tmp('app/AndroidManifest.xml')));
  var application_custom_class = xml_utils.get_manifest_application_class(manifest);

  if (!application_custom_class) {
    console.log('Custom application/@android:name set');
    xml_utils.set_manifest_application_class(manifest, CHETBOT_APPLICATION_CLASS);
    fs.writeFileSync(tmp('app/AndroidManifest.xml'), xml_utils.stringifyXML(manifest));

  } else {
    console.info('App has custom Application. Updating...');

    console.log('Decompiling classes.dex');
    java('-Xmx1024m', '-jar', baksmali, tmp('app/classes.dex'), '-o', tmp('classes-smali'));

    console.log('Converting (MultiDex)Application to ' + CHETBOT_APPLICATION_CLASS);
    mkdir('-p', tmp('classes-chetbot-smali'));
    cp('-r', path.join(chetbot_smali, '*'), tmp('classes-chetbot-smali'));

    // Copy the classes implementing (MultiDex)Application
    var classes_implementing_application = smali_utils.classes_implementing_application(tmp('classes-smali'), application_custom_class);
    for (var i=0; i<classes_implementing_application.length; i++) {
      var java_class = classes_implementing_application[i];
      var srcpath = path.join(tmp('classes-smali'), smali_utils.smali_path(java_class));
      var destpath = path.join(tmp('classes-chetbot-smali'), smali_utils.smali_path(java_class));
      mkdir('-p', path.dirname(destpath));

      if (i === 0) {
        // This is the class that subclasses (MultiDex)Application, so we modify it
        console.log(' ', srcpath, '~>', destpath);
        var src_smali = fs.readFileSync(srcpath, 'utf-8');
        var new_smali = smali_utils.set_smali_application_class(src_smali, CHETBOT_APPLICATION_CLASS);
        fs.writeFileSync(destpath, new_smali);
      } else {
        console.log(' ', srcpath, '->', destpath);
        cp(srcpath, destpath);
      }
    }

    console.log('Generating new classes.dex');
    java('-Xmx1024m', '-jar', smali, tmp('classes-chetbot-smali'), '-o', tmp('classes-chetbot.dex'));
  }

  console.log('Shuffling classes[N].dex files');
  var dex_files = ls(tmp('app/classes*.dex'));
  console.log(tmp('app/classes.dex'), '->', tmp('app/classes' + (dex_files.length + 1) + '.dex'));
  mv(tmp('app/classes.dex'), tmp('app/classes' + (dex_files.length + 1) + '.dex'));

  if (!application_custom_class) {
    console.log('Adding Chetbot dex');
    cp(chetbot_dex, tmp('app/classes.dex'));
  } else {
    console.log('Adding customised Chetbot dex');
    mv(tmp('classes-chetbot.dex'), tmp('app/classes.dex'));
  }

  console.log('Adding new resources');
  mkdir('-p', tmp('app/unknown'));
  cp('-R', path.join(chetbot_resources, '*'), tmp('app/unknown'));
  var apktool_yaml = yaml.safeLoad(fs.readFileSync(tmp('app/apktool.yml'), 'utf8'));
  apktool_yaml['unknownFiles'] = {};
  walk(chetbot_resources, function(dir, filename, stat) {
    if (stat.isFile()) {
      var relpath = path.relative(chetbot_resources, path.join(dir, filename));
      apktool_yaml['unknownFiles'][relpath] = '8';
    }
  });
  fs.writeFileSync(tmp('app/apktool.yml'), yaml.safeDump(apktool_yaml));

  console.log('Re-packaging APK');
  java('-Xmx1024m', '-jar', apktool, '-o', tmp('app.chetbot.apk'), 'build', tmp('app'));

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

  console.log('Moving APK to destination');
  console.log('  -> ' + output_apk);
  mv('-f', tmp('app-aligned.chetbot.apk'), output_apk);

  console.log('Cleaning up');
  rm('-r', tmp());

  return output_apk;
}
