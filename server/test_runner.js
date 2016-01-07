var config = require('config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

var db = require('./db');
var model = {
  results: require('./model/results')
};

var CLOSE_WHEN_FINISHED = function() {
  $(document).on('test-progress', function(e, name, val) {
    if (name === 'onFinish') resolve(name + ': ' + val);
  });
};

exports.run = function(app_id, code_id) {
  var now = Date.now();
  var endpoints = {
    run: '/app/' + app_id + '/test/' + code_id + '/autorun/' + now,
    callback: '/app/' + app_id + '/test/' + code_id + '/report/' + now + '/callback',
  };
  debug('Running', endpoints.run);
  return db.v2.apps.get({Key: {id: app_id}})
  .then(function(app) {
    if (!app) throw new Error('App ' + app_id + ' does not exist');

    // Create somewhere to store the test results
    return model.results.create_automated(code_id, now, app)
  })
  .then(function(result) {
    return request.postAsync({
      url: config.test_runner.protocol + '://' + config.test_runner.host + '/open',
      json: true,
      body: {
        url: config.host.protocol + '://' + config.host.address + endpoints.run + '?access_token=' + result.access_token,
        script: '(' + CLOSE_WHEN_FINISHED.toString() + ')()',
        callback: config.host.protocol + '://' + config.host.address + endpoints.callback + '?access_token=' + result.access_token
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

exports.handle_result = function(code, started_at, result) {
  return model.results.update_with_callback(code, started_at, result)
  .then(function() {
    if (!result.success) {
      debug('Re-running test', code, started_at, result.error);
      // TODO
    }
  });
}
