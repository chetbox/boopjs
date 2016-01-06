var config = require('config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

var db = require('./db');
var model = {
  run_tokens: require('./model/run_tokens'),
  results: require('./model/results')
};

var CLOSE_WHEN_FINISHED = function() {
  $(document).on('test-progress', function(e, name) {
    if (name === 'onFinish') resolve();
  });
};

module.exports = function(app_id, code_id) {
  var now = Date.now();
  var endpoint = '/app/' + app_id + '/test/' + code_id + '/autorun/' + now;
  debug('Running', endpoint);
  return db.v2.apps.get({Key: {id: app_id}})
  .then(function(app) {
    if (!app) throw new Error('App ' + app_id + ' does not exist');

    // Create somewhere to store the test results
    return model.results.create(code_id, now, app)
  })
  .then(function() {
    // Create a run token for the test runner
    return model.run_tokens.create(endpoint);
  })
  .then(function(access_token) {
    return request.postAsync({
      url: config.test_runner.protocol + '://' + config.test_runner.host + '/open',
      json: true,
      body: {
        url: config.host.protocol + '://' + config.host.address + endpoint + '?access_token=' + access_token,
        script: '(' + CLOSE_WHEN_FINISHED.toString() + ')()'
      }
    });
  })
  .spread(function(resp, body) {
    if (resp.statusCode !== 200) {
      throw new Error('HTTP error ' + resp.statusCode + ': ' + body);
    }
    return body;
  });
}
