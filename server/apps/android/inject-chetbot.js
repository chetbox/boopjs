var os = require('os');
var fs = require('fs');
var path = require('path');
var shortid = require('shortid');
var zip_utils = require('./zip-utils')

require('./tools').global();
require('shelljs/global');
config.silent = true;

exports.find_main_activity = function(apk_file) {
  var tmp = path.join(os.tmpdir(), shortid.generate());
  mkdir('-p', tmp);

  var manifest_file = path.join(tmp, 'AndroidManifest.xml');
  java('-jar', apk_parser, apk_file).to(manifest_file);

  // TODO: port to node XML processing
  var main_activity = xmlstarlet('sel', '-t', '-v',
      '/manifest' +
      '/application' +
      '/activity[' +
        'intent-filter/category/@android:name="android.intent.category.LAUNCHER" ' +
        'and ' +
        'intent-filter/action/@android:name="android.intent.action.MAIN"]' +
      '/@android:name',
    manifest_file
  );

  // Clean up
  fs.unlinkSync(manifest_file);
  fs.rmdirSync(tmp);

  return main_activity;
}

function inject_chetbot_start(activity_smali_file) {
  var smali_src = String(fs.readFileSync(activity_smali_file));
  smali_src = smali_src.replace(
    /^(\.method protected onCreate\(Landroid\/os\/Bundle;\)V[\s\S]*?\.prologue\b)/m,
    '$1' +
    '\n\n' +
    '    # Injected by Chetbot\n' +
    '    invoke-static {p0}, Lcom/chetbox/chetbot/android/Chetbot;->start(Landroid/app/Activity;)V\n');
  fs.writeFileSync(activity_smali_file, smali_src);
}

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

  console.log('Copying APK');
  console.log('  ' + input_apk);
  cp(input_apk, tmp('app.apk'));

  console.log('Extracting classes.dex');
  fs.writeFileSync(
    tmp('classes.dex'),
    zip_utils.extract_file(tmp('app.apk'), 'classes.dex'),
    {encoding :null}
  );

  console.log('Decompiling');
  java('-jar', baksmali, '-x', tmp('classes.dex'), '-o', tmp('app-smali'));

  console.log('Finding main activity');
  var main_activity = exports.find_main_activity(tmp('app.apk'));
  console.log('  ' + main_activity);

  console.log('Injecting "Chetbot.start( );"');
  var main_activity_smali = path.join(tmp('app-smali'), main_activity.replace(/\./g, '/') + '.smali');
  inject_chetbot_start(main_activity_smali);

  console.log('Adding Chetbot sources');
  cp('-R', chetbot_smali, tmp('app-smali'));

  console.log('Recompiling');
  rm(tmp('classes.dex'));
  java('-jar', smali, tmp('app-smali'), '-o', tmp('classes.dex'));

  console.log('Updating APK');
  zip('-j', tmp('app.apk'), tmp('classes.dex'));

  console.log('Removing old signing info');
  zip('-d', tmp('app.apk'), 'META-INF/*');

  console.log('Signing');
  jarsigner(
      '-digestalg', 'SHA1',
      '-sigalg', 'MD5withRSA',
      '-keystore', android_debug_keystore,
      '-storepass', 'android',
      '-keypass', 'android',
      tmp('app.apk'),
      'androiddebugkey'
  );
  jarsigner('-verify', '-certs', tmp('app.apk'));

  console.log('Zip-aligning');
  zipalign('4', tmp('app.apk'), tmp('app-aligned.apk'));

  console.log('Copying APK to destination');
  console.log('  -> ' + output_apk);
  mv('-f', tmp('app-aligned.apk'), output_apk);

  console.log('Cleaning up');
  rm('-r', tmp());

  return output_apk;
}
