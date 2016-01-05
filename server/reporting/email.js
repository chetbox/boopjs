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

var admin_footer = util.format('\nAdmin: %s://%s/admin\n', config.host.protocol, config.host.address);

exports.message = {
  new_user: function(user) {
    return {
      subject: util.format('%s signed up', user.displayName),
      body: util.format('%s (%s) signed up\n', user.displayName, user.username) +
            util.format('%s: %s\n', user.provider, user.profileUrl) +
            admin_footer
    };
  },
  new_app: function(user, app) {
    return {
      subject: util.format('%s uploaded %s', user.username, app.name),
      body: util.format('%s (%s) uploaded an %s app\n', user.displayName, user.username, app.platform) +
            util.format('%s: %s\n\n', user.provider, user.profileUrl) +
            util.format('%s (%s)\n', app.name, app.identifier) +
            util.format('%s://%s/app/%s\n', config.host.protocol, config.host.address, app.id) +
            admin_footer
    };
  },
  error: function(url, user, err) {
    return {
      subject: util.format('Error: %s', err.message || err.toString()),
      body: util.format('User %s (%s) encountered an uncaught error on page:\n%s\n', user.displayName, user.username, url) +
            (user ? util.format('%s: %s\n', user.provider, user.profileUrl) : '') +
            util.format('\n%s\n', err.stack || err.message || err.toString()) +
            admin_footer
    };
  }
}
