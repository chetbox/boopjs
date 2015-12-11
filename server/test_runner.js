var config = require('config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

var model = {
  run_tokens: require('./model/run_tokens')
};

exports.run = function(app_id, code_id) {
  var endpoint = '/app/' + app_id + '/run/' + code_id;
  return model.run_tokens.create(endpoint)
  .then(function(access_token) {
    return request.postAsync({
      url: config.test_runner.protocol + '://' + config.test_runner.host + '/run',
      json: true,
      body: {
        url: config.host + '://' + endpoint + '?access_token=' + access_token,
        script: '// TODO: close when test finishes'
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
