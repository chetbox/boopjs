var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('underscore');

function get(endpoint, access_token) {
  return request.getAsync({
    url: 'https://api.github.com' + endpoint,
    headers: _.extend({},
      {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'boop.js'
      },
      access_token
        ? { Authorization: 'token ' + access_token }
        : {}
    ),
    json: true
  })
  .then(function(resp) {
    if (resp.statusCode !== 200) {
      throw 'HTTP error ' + resp.statusCode + ': ' + resp.body;
    }
    return resp.body;
  });
}

exports.user_public = function(username) {
  return get('/users/' + username);
}

exports.user = function(access_token) {
  return get('/user', access_token);
}

exports.emails = function(access_token) {
  return get('/user/emails', access_token)
  .filter(function(entry) {
    return entry.verified;
  })
  .filter(function(entry) {
    // Remove GitHub's noreply address
    return !entry.email.match(/@users\.noreply\.github\.com$/);
  })
  .reduce(function(obj, entry) {
    obj[entry.email] = _.omit(entry, 'email');
    return obj;
  }, {});
}
