var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('underscore');
var email_config = require('config').email;

function send(message) {
  return request.postAsync({
    url: email_config.correo.send_url,
    json: true,
    body: message
  });
}

exports.send_to_admins = function(message) {
  return send(_.extend(message, {
    to: email_config.admins
  }));
}
