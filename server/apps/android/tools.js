var path = require('path');
var exec = require('shelljs').exec;

['zip', 'unzip', 'java', 'xmlstarlet', 'jarsigner', 'zipalign'].forEach(function(cmd) {
  function escape_arg(s) {
    return "'" + s.replace("'", "\\'") + "'";
  }
  exports[cmd] = function() {
    var result = exec(cmd + ' ' + [].slice.call(arguments).map(escape_arg).join(' '));
    if (result.code !== 0) {
      throw '\'' + cmd + '\' exited with status ' + result.code + ': ' + (result.output || error());
    }
    return result.output;
  };
});

exports.apk_parser = path.join(__dirname, 'deps', 'APKParser.jar');
exports.smali = path.join(__dirname, 'deps', 'smali.jar');
exports.baksmali = path.join(__dirname, 'deps', 'baksmali.jar');
exports.chetbot_smali = path.join(__dirname, 'deps', 'chetbot-smali', '*');

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
