var AWS = require('aws-sdk');
var Promise = require('bluebird');
var config = require('config');

AWS.config.update(config.get('s3'));

module.exports.client_upload_request = function(bucket, file_path) {
  var s3 = new AWS.S3();

  return Promise.promisify(s3.getSignedUrl, s3)('putObject', {
    Bucket: bucket,
    Key: file_path,
    Expires: 60,
    ACL: 'public-read'
  })
  .then(function(data) {
    return {
      signed_request: data,
      url: 'https://' + bucket + '.s3.amazonaws.com/' + file_path
    };
  })
};
