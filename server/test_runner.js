var config = require('config');
var url = require('url');
var shortid = require('shortid');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

var db = require('./db');
var fail_on_error = require('./util').fail_on_error;

function create_access_token(endpoint) {
  var token = shortid.generate();
  return db.run_tokens().insert({
    endpoint: endpoint,
    token: token
  })
  .then(function() {
    return token;
  });
}

exports.consume_access_token = function(access_token_query_key) {
  return function(req, res, next) {
    var endpoint = url.parse(req.originalUrl).pathname;
    var token = req.query[access_token_query_key];
    db.run_tokens().find({hash: endpoint, range: token})
    .then(function(run_token) {
      if (run_token) {
        return db.run_tokens().remove({hash: endpoint, range: token})
        .then(function() {
          next();
        });
      } else {
        res.sendStatus(403);
      }
    })
    .catch(fail_on_error(res));
  };
}

exports.run = function(app_id, code_id) {
  var endpoint = '/app/' + app_id + '/run/' + code_id;
  return create_access_token(endpoint)
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
