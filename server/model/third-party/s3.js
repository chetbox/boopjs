var config = require('config');
var AWS = require('aws-sdk');
var Promise = require('bluebird');
var s3 = Promise.promisifyAll(new AWS.S3(config.get('aws.s3')));
var fs = Promise.promisifyAll(require('fs'));
var url = require('url');

var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''));

exports.url = function(bucket, file_path) {
  return url.format({
    protocol: 'https',
    host: bucket + '.s3.amazonaws.com',
    pathname: file_path
  });
}

exports.client_upload_request = function(bucket, path, content_type) {
  debug('client_upload_request', bucket, path, content_type);
  return s3.getSignedUrlAsync('putObject', {
    Bucket: bucket,
    Key: path,
    Expires: 60,
    ACL: 'authenticated-read',
    ContentType: content_type || undefined
  })
  .then(function(data) {
    return {
      signed_request: data,
      s3_bucket: bucket,
      s3_path: path
    };
  })
};

exports.download = function(bucket, path) {
  debug('download', bucket, path);
  return s3.getObjectAsync({
    Bucket: bucket,
    Key: path
  })
  .then(function(response) {
    return response.Body;
  });
};

exports.upload = function(file, bucket, s3_path) {
  debug('upload', file, bucket, s3_path);
  return fs.readFileAsync(file)
  .then(function(data) {
    return s3.putObjectAsync({
      Bucket: bucket,
      Key: s3_path.replace(/^\//, ''),
      ACL: 'public-read',
      Body: new Buffer(data, 'binary')
    });
  })
  .then(function() {
    return exports.url(bucket, s3_path);
  });
}
