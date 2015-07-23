var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var config = require('config');

var appetize_io_token = config.get('appetize_io').token;

function appetizeio_update(body) {
  return request.postAsync({
    url: 'https://api.appetize.io/v1/app/update',
    json: true,
    body: body
  })
  .spread(function(resp, body) {
    if (resp.statusCode !== 200) {
      throw 'HTTP error ' + resp.statusCode + ': ' + body;
    }
    return body;
  });
}

module.exports.create_app = function(app_url, platform) {
  return appetizeio_update({
    token: appetize_io_token,
    url: app_url,
    platform : platform
  });
};

module.exports.update_app = function(private_key, app_url, platform) {
  return appetizeio_update({
    privateKey: private_key,
    token: appetize_io_token,
    url: app_url,
    platform: platform
  });
};
