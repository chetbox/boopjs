var path = require('path');
var shell = require('shelljs');
shell.config.silent = true;

['zip', 'java', 'jarsigner', 'zipalign', 'aapt'].forEach(function(cmd) {
  function escape_arg(s) {
    return "'" + s.replace("'", "\\'") + "'";
  }
  exports[cmd] = function() {
    var result = shell.exec(cmd + ' ' + [].slice.call(arguments).map(escape_arg).join(' '));
    if (result.code !== 0) {
      throw '\'' + cmd + '\' exited with status ' + result.code + ': ' + (result.output || shell.error());
    }
    return result.output;
  };
});

exports.apktool = path.join(__dirname, 'deps', 'apktool_2.0.3.jar');
exports.chetbot_dex = path.join(__dirname, 'deps', 'classes-chetbot.dex');
exports.chetbot_smali = path.join(__dirname, 'deps', 'classes-chetbot');
exports.chetbot_resources = path.join(__dirname, 'deps', 'resources-chetbot');
exports.smali = path.join(__dirname, 'deps', 'smali-2.1.0.jar');
exports.baksmali = path.join(__dirname, 'deps', 'baksmali-2.1.0.jar');

exports.global = function() {
  for (var cmd in exports) {
    if (cmd !== 'global') {
      if (!global[cmd]) {
        global[cmd] = exports[cmd];
      } else {
        console.warn('Global function "' + cmd + '" already defined');
      }
    }
  }
};
