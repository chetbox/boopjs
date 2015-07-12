var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var config = require('config');

module.exports.create_app = function(app_url, platform) {
  return request.postAsync({
    url: 'https://api.appetize.io/v1/app/update',
    json: true,
    body: {
      token: config.get('appetize_io').token,
      url: app_url,
      platform : platform
    }
  })
  .spread(function(resp, body) {
    if (resp.statusCode !== 200) {
      throw 'HTTP error ' + resp.statusCode + ': ' + body;
    }
    return body;
  })
};
