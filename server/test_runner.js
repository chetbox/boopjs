var url = require('url');
var shortid = require('shortid');

var db = require('./db');
var fail_on_error = require('./util').fail_on_error;

exports.create_access_token = function(endpoint) {
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
    var endpoint = url.parse(req.url).pathname;
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
