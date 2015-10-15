require('shelljs/global');
var fs = require('fs');
var path = require('path');

RegExp.quote = function(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

exports.set_smali_application_class = function(src, java_class) {
  // TODO: pass parameter to choose which of Application or MultiDexApplication to replace
  var smali_class = exports.smali_class(java_class);
  src = src.replace(/^\.super +L(android\/app\/Application|android\/support\/multidex\/MultiDexApplication);/gm, '.super ' + smali_class);
  src = src.replace(/\bL(android\/app\/Application|android\/support\/multidex\/MultiDexApplication);->/g, smali_class + '->');
  return src;
}

exports.smali_class = function(java_class) {
  return 'L' + java_class.replace(/\./g, path.sep) + ';';
}

exports.smali_path = function(java_class) {
  return java_class.replace(/\./g, path.sep) + '.smali';
}

exports.java_class = function(smali_class) {
  return smali_class.replace(/^L/, '').replace(/;$/, '').replace(/\//g, '.');
}

exports.smali_superclass = function(smali_src) {
  return smali_src.match(/^\.super ([^;]*;)$/m)[1];
}

exports.classes_implementing_application = function(smali_dir, application_class) {
  var smali_file = path.join(smali_dir, exports.smali_path(application_class));
  var smali_src = fs.readFileSync(smali_file, 'utf-8');
  var superclass = exports.java_class(exports.smali_superclass(smali_src));
  if (superclass === 'android.app.Application' ||
      superclass === 'android.support.multidex.MultiDexApplication') {
    return [application_class];
  } else {
    return exports.classes_implementing_application(smali_dir, superclass).concat([application_class]);
  }
}

exports.renamespace = function(in_smali_dir, out_smali_dir, class_regex, class_replacement) {

  if (fs.existsSync(out_smali_dir)) {
    throw new Error(out_smali_dir + ' already exists');
  }

  mkdir('-p', out_smali_dir);

  var all_classes = find(in_smali_dir)
  .filter(function(f) {
    return f.match(/\.smali$/);
  })
  .map(function(current_path) {
    return path.relative(in_smali_dir, current_path).replace(/\.smali$/, '');
  });

  var transformation = {};
  all_classes.forEach(function(c) {
    if (c.match(class_regex)) {
      var old_smali_class = 'L' + c + ';'
      var new_smali_class = 'L' + c.replace(class_regex, class_replacement) + ';';
      transformation[old_smali_class] = new_smali_class;
      transformation['"' + exports.java_class(old_smali_class) + '"'] = '"' + exports.java_class(new_smali_class) + '"';
    }
  });

  var megaregex = new RegExp(
    Object.keys(transformation).map(function(c) {
      return RegExp.quote(c);
    }).join('|')
  , 'g');

  all_classes.forEach(function(current_class) {
    var current_path = path.join(in_smali_dir, current_class + '.smali');
    var new_class = current_class.replace(class_regex, class_replacement);
    var new_path = path.normalize(path.join(out_smali_dir, new_class + '.smali'));
    var current_smali = fs.readFileSync(current_path, 'utf-8');
    var new_smali = current_smali.replace(megaregex, function(match) {
      return transformation[match];
    });

    console.log(current_class, (current_smali === new_smali) ? '->' : '~>', new_class);

    mkdir('-p', path.dirname(new_path));
    fs.writeFileSync(new_path, new_smali);
  });

}
