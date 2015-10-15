var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

exports.user = function(username) {
  return request.getAsync({
    url: 'https://api.github.com/users/' + username,
    headers: {
      'User-Agent': 'Chetbot'
    },
    json: true
  })
  .spread(function(resp, body) {
    if (resp.statusCode !== 200) {
      throw 'HTTP error ' + resp.statusCode + ': ' + body;
    }
    return body;
  });
}
