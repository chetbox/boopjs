var xml2js = require('xml2js');

exports.get_manifest_application_class = function(manifest_xml) {
  return manifest_xml.manifest.application[0]['$']['android:name'];
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
