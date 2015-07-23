var _ = require('underscore');
var path = require('path');
var tools = require('./tools');

// hack to parse quoted string things
function parse_value(val) {
  if (val[0] === "'" && val[val.length-1] === "'") {
    // hack to parse Javacsript-ish string values
    return eval(val);
  }
  if (val.indexOf('=') >= 0) {
    return _.object(
      val
      .trim()
      .split(/\s+/)
      .map(function(entry) {
        var i = entry.indexOf('=');
        return [entry.slice(0, i), parse_value(entry.slice(i+1))];
      })
    );
  }
  return val;
}

function base64_file_contents(zip_file, file_name) {
  return new Buffer(tools.unzip('-p', zip_file, file_name)).toString('base64')
}

module.exports = function(apk_file) {
  var apk_info = _.object(
    tools.aapt('dump', 'badging', apk_file)
    .split('\n')
    .map(function(line) {
      var i = line.indexOf(':');
      return [line.slice(0, i), parse_value(line.slice(i+1))];
    })
  );

  return {
    name: apk_info['application-label'],
    icon: 'data:image/png;base64,' + base64_file_contents(apk_file, apk_info['application-icon-320']),
    identifier: apk_info.package.name,
    version: apk_info.package.versionName
  };
};
