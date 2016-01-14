var url = require('url');

var s3 = require.main.require('./model/third-party/s3');

var get_apk_info = require('./info');
var inject_chetbot = require('./inject-chetbot');

module.exports = function(user_apk_url) {
  // TODO: cleanup downloaded files
  // TODO: return immediately and show user a progress page

  console.log('Downloading app', user_apk_url);
  return s3.download(user_apk_url)
  .then(function(apk) {
    console.log('Getting info from APK');
    var apk_info = get_apk_info(apk);
    console.log('  ' + apk_info.name)
    return [apk, apk_info];
  })
  .spread(function(apk, apk_info) {
    console.log('Adding Chetbot to APK', apk);
    return [apk_info, inject_chetbot.add_chetbot_to_apk(apk)];
  })
  .spread(function(apk_info, modified_apk_file) {
    console.log('Uploading ' + modified_apk_file + ' to S3');
    return [apk_info, s3.upload(modified_apk_file, 'chetbot-apps-v1', url.parse(user_apk_url).pathname + '.chetbot.apk')];
  });
}
