var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('underscore');
var util = require('util');
var config = require('config');

function send(message) {
  return request.postAsync({
    url: config.email.correo.send_url,
    json: true,
    body: message
  });
}

exports.send_to_admins = function(message) {
  return send(_.extend(message, {
    to: config.email.admins
  }));
}

exports.message = {
  new_user: function(user) {
    return {
      subject: util.format('%s signed up', user.displayName),
      body: util.format('%s (%s) signed up\n', user.displayName, user.username) +
            util.format('%s: %s\n\n', user.provider, user.profileUrl) +
            util.format('Admin: %s://%s/admin\n', config.host.protocol, config.host.address)
    };
  },
  new_app: function(user, app) {
    return {
      subject: util.format('%s uploaded %s', user.username, app.name),
      body: util.format('%s (%s) uploaded an %s app\n', user.displayName, user.username, app.platform) +
            util.format('%s: %s\n\n', user.provider, user.profileUrl) +
            util.format('%s (%s)\n', app.name, app.identifier) +
            util.format('%s://%s/app/%s\n\n', config.host.protocol, config.host.address, app.id) +
            util.format('Admin: %s://%s/admin\n', config.host.protocol, config.host.address)
    };
  }
}
