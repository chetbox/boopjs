var xml2js = require('xml2js');

function expand_class_name(package_name, name) {
  return name && name[0] === '.'
    ? package_name + name
    : name;
}

exports.package_name = function(manifest_xml) {
  return manifest_xml.manifest['$'].package;
}

exports.get_manifest_application_class = function(manifest_xml) {
  return expand_class_name(
    exports.package_name(manifest_xml),
    manifest_xml.manifest.application[0]['$']['android:name']
  );
}

exports.set_manifest_application_class = function(manifest_xml, value) {
  manifest_xml.manifest.application[0]['$']['android:name'] = value;
}

exports.parseXML = function(str) {
  var xml;
  xml2js.parseString(str, function(err, _xml) {
    // parseString is synchronous by default
    xml = _xml;
  });
  return xml;
}

exports.stringifyXML = function(xml) {
  var xml_builder = new xml2js.Builder();
  return xml_builder.buildObject(xml);
}

exports.remove_unsupported_styles = function(styles_xml) {
  styles_xml.resources.style = styles_xml.resources.style.filter(function(s) {
    return s['$'].parent !== '@android:style/WindowTitle'
        && s['$'].parent !== '@android:style/WindowTitleBackground';
  });
}

exports.add_permission = function(permission_to_add, manifest_xml) {
  var uses_permissions = manifest_xml.manifest['uses-permission'] || [];
  var has_permission_to_add = uses_permissions.reduce(function(has_permission, iter_permission) {
    return has_permission || iter_permission['$']['android:name'] === permission_to_add;
  }, false);
  if (!has_permission_to_add) {
    uses_permissions.push({
      '$': { 'android:name': permission_to_add }
    });
    manifest_xml.manifest['uses-permission'] = uses_permissions;
  }
};
