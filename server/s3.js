var AWS = require('aws-sdk');
var Promise = require('bluebird');
var config = require('config');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var os = require('os');
var path = require('path');
var sh = require('shelljs');
var url = require('url');

AWS.config.update(config.get('aws.s3'));

var tmp_dir = path.join(os.tmpdir(), 'chetbot.s3');
sh.mkdir('-p', tmp_dir);

function s3_url(bucket, file_path) {
  return url.format({
    protocol: 'https',
    host: bucket + '.s3.amazonaws.com',
    pathname: file_path
  });
}

module.exports.client_upload_request = function(bucket, file_path, content_type) {
  var s3 = new AWS.S3();

  return Promise.promisify(s3.getSignedUrl, s3)('putObject', {
    Bucket: bucket,
    Key: file_path,
    Expires: 60,
    ACL: 'public-read',
    ContentType: content_type || undefined
  })
  .then(function(data) {
    return {
      signed_request: data,
      url: s3_url(bucket, file_path)
    };
  })
};

module.exports.download = function(url) {
  var output_file = path.join(tmp_dir, path.basename(url));
  return request.getAsync(url, {encoding: null})
  .spread(function(response, data) {
    return fs.writeFileAsync(output_file, data);
  })
  .then(function() {
    return output_file;
  })
};

module.exports.upload = function(file, bucket, file_path) {
  var s3 = new AWS.S3();

  return fs.readFileAsync(file)
  .then(function(data) {
    return Promise.promisify(s3.putObject, s3)({
      Bucket: bucket,
      Key: file_path.replace(/^\//, ''),
      ACL: 'public-read',
      Body: new Buffer(data, 'binary')
    });
  })
  .then(function() {
    return s3_url(bucket, file_path);
  });
}
