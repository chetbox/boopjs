require('shelljs/global');
var fs = require('fs');
var path = require('path');

RegExp.quote = function(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

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

  var to_transform = all_classes.filter(function(c) {
    return c.match(class_regex);
  });

  var megaregex = new RegExp(
    'L('
    + to_transform.map(function(c) {
      return RegExp.quote(c);
    }).join('|')
    + ');'
  , 'g');

  all_classes.forEach(function(current_class) {
    var current_path = path.join(in_smali_dir, current_class + '.smali');
    var new_class = current_class.replace(class_regex, class_replacement);
    var new_path = path.normalize(path.join(out_smali_dir, new_class + '.smali'));
    var current_smali = fs.readFileSync(current_path, 'utf-8');
    var new_smali = current_smali.replace(megaregex, function(match, old_class) {
      return 'L' + old_class.replace(class_regex, class_replacement) + ';';
    });

    console.log(current_class, (current_smali === new_smali) ? '->' : '~>', new_class);

    mkdir('-p', path.dirname(new_path));
    fs.writeFileSync(new_path, new_smali);
  });

}
