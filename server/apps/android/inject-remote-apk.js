var shortid = require('shortid');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''));

var tmp = require.main.require('./tmp');
var s3 = require.main.require('./model/third-party/s3');

var get_apk_info = require('./info');
var inject_chetbot = require('./inject-chetbot');

/**
 * Download an APK, inject it and upload to S3.
 * Download can be from S3 via options.s3_src_bucket and options.s3_src_path
 * or using a public URL via options.src_url
 */
module.exports = function(options) {
  if (options.s3_src_path && !options.s3_src_bucket) {
    throw new Error('No s3_src_bucket specified');
  }
  if (!options.s3_src_path && !options.src_url) {
    throw new Error('No s3_src_path or src_url specified');
  }

  debug('Downloading app', options.s3_src_path || options.src_url);
  return (options.s3_src_path
    ? s3.download(options.s3_src_bucket, options.s3_src_path)
    : request.getAsync(options.src_url, {encoding: null})
      .then(function(response) {
        if (response.statusCode !== 200) {
          throw new Error('HTTP ' + response.statusCode + ': ' + response.statusMessage);
        }
        return response.body;
      })
  )
  .then(function(file) {
    return tmp.save_file(file);
  })
  .then(function(apk_path) {
    var apk_info = get_apk_info(apk_path);
    debug('Adding Chetbot to APK', apk_path, apk_info.name);
    var modified_apk_file = inject_chetbot.add_chetbot_to_apk(apk_path);

    var new_app_filename = shortid.generate() + '.chetbot.apk';
    debug('Uploading ' + modified_apk_file + ' to S3', new_app_filename);
    return [
      apk_info,
      s3.upload(modified_apk_file, 'chetbot-apps-v1', new_app_filename)
    ];
  });
}
