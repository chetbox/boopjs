var os = require('os');
var fs = require('fs');
var path = require('path');
var shortid = require('shortid');

require('shelljs/global');
config.silent = true;


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

// helpers
['zip', 'unzip', 'smali', 'baksmali', 'java', 'xmlstarlet', 'jarsigner', 'zipalign'].forEach(function(cmd) {
  function escape_arg(s) {
    return "'" + s.replace("'", "\\'") + "'";
  }
  global[cmd] = function() {
    var result = exec(cmd + ' ' + [].slice.call(arguments).map(escape_arg).join(' '));
    if (result.code !== 0) {
      throw '\'' + cmd + '\' exited with status ' + result.code + ': ' + (result.output || error());
    }
    return result.output;
  };
});

function user_home() {
  return process.env.HOME || process.env.USERPROFILE;
}

function tmp_dir() {
  var dir = path.join(os.tmpdir(), 'chetbot.inject', shortid.generate());
  return function(file) {
    return file ? path.join(dir, file) : dir;
  }
}

module.exports = function(input_apk, output_apk) {

  output_apk = output_apk || input_apk;

  var apk_parser = path.join(__dirname, 'APKParser.jar');
  var chetbot_smali = path.join(__dirname, 'chetbot-smali', '*');

  // TODO: generate a key that lasts longer and store it in the project
  var android_debug_keystore = path.join(user_home(), '.android', 'debug.keystore');

  var tmp = tmp_dir();

  rm('-rf', tmp()); // make sure there's no junk lying around
  mkdir('-p', tmp());

  console.log('Copying APK');
  console.log('  ' + input_apk);
  cp(input_apk, tmp('app.apk'));

  console.log('Extracting classes.dex');
  unzip(tmp('app.apk'), 'classes.dex', '-d', tmp());

  console.log('Decompiling');
  baksmali('-x', tmp('classes.dex'), '-o', tmp('app-smali'));

  console.log('Finding main activity');
  java('-jar', apk_parser, tmp('app.apk')).to(tmp('AndroidManifest.xml'));

  // TODO: port to node XML processing
  var main_activity = xmlstarlet('sel', '-t', '-v',
    '/manifest' +
    '/application' +
    '/activity[' +
      'intent-filter/category/@android:name="android.intent.category.LAUNCHER" ' +
      'and ' +
      'intent-filter/action/@android:name="android.intent.action.MAIN"]' +
    '/@android:name',
    tmp('AndroidManifest.xml')
  );
  console.log('  ' + main_activity);

  console.log('Injecting "Chetbot.start( );"');
  var main_activity_smali = path.join(tmp('app-smali'), main_activity.replace(/\./g, '/') + '.smali');
  inject_chetbot_start(main_activity_smali);

  console.log('Adding Chetbot sources');
  cp('-R', chetbot_smali, tmp('app-smali'));

  console.log('Recompiling');
  rm(tmp('classes.dex'));
  smali(tmp('app-smali'), '-o', tmp('classes.dex'));

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
