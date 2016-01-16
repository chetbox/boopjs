var config = require('config');
var AWS = require('aws-sdk');
var Promise = require('bluebird');
var s3 = Promise.promisifyAll(new AWS.S3(config.get('aws.s3')));
var requestAsync = Promise.promisify(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var os = require('os');
var path = require('path');
var sh = require('shelljs');
var url = require('url');

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
  return s3.getSignedUrlAsync('putObject', {
    Bucket: bucket,
    Key: file_path,
    Expires: 60,
    ACL: 'public-read', // We should be able to make this private as long as the S3 user can read
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
  return requestAsync(url, { encoding: null })
  .then(function(response) {
    return fs.writeFileAsync(output_file, response.body);
  })
  .then(function() {
    return output_file;
  })
};

module.exports.upload = function(file, bucket, file_path) {
  return fs.readFileAsync(file)
  .then(function(data) {
    return s3.putObjectAsync({
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
