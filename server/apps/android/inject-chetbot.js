var os = require('os');
var fs = require('fs');
var path = require('path');
var shortid = require('shortid');
var zip_utils = require('./zip-utils');
var xml2js = require('xml2js');

var CHETBOT_APPLICATION_CLASS = 'com.chetbox.chetbot.android.ChetbotApplication';

require('shelljs/global');
global.grep = undefined; // use "grep" from "./tools"
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

exports.set_manifest_application_class = function(src_manifest_file, application_class) {
  var manifest;
  xml2js.parseString(fs.readFileSync(src_manifest_file), function(err, xml) {
    // parseString is synchronous by default
    manifest = xml;
  });

  if (manifest.manifest.application[0]['$']['android:name']) {
    return false;
  }
  manifest.manifest.application[0]['$']['android:name'] = application_class;

  var xml_builder = new xml2js.Builder();
  return xml_builder.buildObject(manifest);
}

exports.set_smali_application_class = function(src_smali_file, application_class) {
  var replacement = '.super L' + application_class.replace(/\./g, '/') + ';';
  var src = fs.readFileSync(src_smali_file, 'utf-8');
  return src.replace(/^\.super Landroid\/app\/Application;$/m, replacement);
}

exports.find_application_subclasses = function(smali_dir) {
  return grep('-l', '^\\.super Landroid/app/Application;$', '-r', smali_dir)
    .trim()
    .split('\n')
    .map(function(abs_path) {
      return path.relative(smali_dir, abs_path);
    });
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
  java('-jar', apktool, 'decode', '--no-src', tmp('app.apk'), '-o', tmp('app'));

  console.log('Attempting to set custom Application in AndroidManifest.xml');
  var manifest_with_custom_application = exports.set_manifest_application_class(tmp('app/AndroidManifest.xml'), CHETBOT_APPLICATION_CLASS);

  if (manifest_with_custom_application) {
    console.log('Custom application/@android:name set');
    fs.writeFileSync(tmp('app/AndroidManifest.xml'), manifest_with_custom_application);
  } else {
    console.info('App has custom Application. Updating...');

    console.log('Decompiling classes.dex');
    java('-jar', baksmali, '-o', tmp('classes-smali'), tmp('app/classes.dex'));

    console.log('Converting Application sublasses to ' + CHETBOT_APPLICATION_CLASS);
    mkdir('-p', tmp('classes-chetbot-smali'));
    cp('-r', path.join(chetbot_smali, '*'), tmp('classes-chetbot-smali'));
    var application_subclasses = exports.find_application_subclasses(tmp('classes-smali'));
    if (!application_subclasses) {
      throw 'No sublasses of android.app.Application found';
    }
    application_subclasses.forEach(function(relpath) {
      var srcpath = path.join(tmp('classes-smali'), relpath);
      var destpath = path.join(tmp('classes-chetbot-smali'), relpath);
      console.log(srcpath, '~>', destpath);
      mkdir('-p', path.dirname(destpath));
      fs.writeFileSync(destpath, exports.set_smali_application_class(srcpath, CHETBOT_APPLICATION_CLASS));
    });

    console.log('Generating new classes.dex');
    rm(tmp('app/classes.dex'));
    java('-jar', smali, '-o', tmp('classes-chetbot.dex'), tmp('classes-chetbot-smali'));
  }

  console.log('Shuffling classes[N].dex files');
  var dex_files = ls(tmp('app'))
    .filter(function(f) { return f.match(/classes[0-9]*\.dex/); })
    .sort();
  mv(tmp('app/classes.dex'), tmp('app/classes' + (dex_files.length + 1) + '.dex'));

  console.log('Adding Chetbot dex');
  if (manifest_with_custom_application) {
    cp(chetbot_dex, tmp('app/classes.dex'));
  } else {
    mv(tmp('classes-chetbot.dex'), tmp('app/classes.dex'));
  }

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
