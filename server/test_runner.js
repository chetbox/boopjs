var config = require('config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

var db = require.main.require('./db');
var model = {
  apps: require.main.require('./model/apps'),
  code: require.main.require('./model/code'),
  results: require.main.require('./model/results'),
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

  debug('run', endpoints.run);

  return db.v2.apps.get({Key: {id: app_id}})
  .then(function(app) {
    if (!app) throw new Error('App ' + app_id + ' does not exist');

    // Create somewhere to store the test results
    return model.results.create_automated(code_id, now, app);
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
  .then(function(resp) {
    if (resp.statusCode !== 200) {
      throw new Error('HTTP error ' + resp.statusCode + ': ' + resp.body);
    }
    return resp.body;
  });
}

exports.run_all = function(app_id) {
  debug('run_all', app_id);
  model.apps.set_pending_report(app_id, true)
  .then(function() {
    return model.code.get_all(app_id);
  })
  .map(function(code) {
    return model.code.remove_latest_result(code.app_id, code.id)
    .then(function() {
      return exports.run(app_id, code.id);
    })
  });
};

exports.handle_result = function(code, started_at, result) {
  return model.results.update_with_callback(code, started_at, result)
  .then(function() {
    if (!result.success) {
      debug('Re-running test (TODO)', code, started_at, result.error);
      // TODO
    }
  });
}
