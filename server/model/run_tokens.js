var url = require('url');
var shortid = require('shortid');

var db = require('../db');

exports.create = function(endpoint) {
  var token = shortid.generate();
  return db.run_tokens().insert({
    endpoint: endpoint,
    token: token
  })
  .then(function() {
    return token;
  });
};

exports.middleware = {
  consume: function(access_token_query_key) {
    return function(req, res, next) {
      var endpoint = url.parse(req.originalUrl).pathname;
      var token = req.query[access_token_query_key];
      if (!token) {
        res.status(400).send(access_token_query_key + ' not specified');
        return;
      }
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
      .catch(next);
    };
  }
};
