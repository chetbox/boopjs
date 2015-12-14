var config = require('config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

var model = {
  run_tokens: require('./model/run_tokens')
};

module.exports = function(endpoint) {
  return model.run_tokens.create(endpoint)
  .then(function(access_token) {
    return request.postAsync({
      url: config.test_runner.protocol + '://' + config.test_runner.host + '/open',
      json: true,
      body: {
        url: config.host.protocol + '://' + config.host.address + endpoint + '?access_token=' + access_token,
        script: "$(document).on('test-progress', function(e, name) { if (name === 'onFinish') close(); });"
      }
    });
  })
  .spread(function(resp, body) {
    if (resp.statusCode !== 200) {
      throw 'HTTP error ' + resp.statusCode + ': ' + body;
    }
    return body;
  });
}
