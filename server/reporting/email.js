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

exports.send_to = function(recipients, message) {
  if (!recipients) {
    throw new Error('No recipients specified');
  }
  return send(_.extend(message, {
    to: recipients,
    bcc: config.email.admins
  }));
}

exports.send_to_admins = function(message) {
  return send(_.extend(message, {
    to: config.email.admins
  }));
}

var admin_footer = util.format('\nAdmin: %s://%s/admin\n', config.host.protocol, config.host.address);

function email_addresses(user) {
  return Array.isArray(user.emails)
    ? user.emails.map(function(e) {
        return e.email;
      })
    : [];
}

exports.message = {
  new_user: function(user) {
    return {
      subject: util.format('%s signed up', user.displayName),
      body: util.format('%s (%s) signed up\n', user.displayName, user.username) +
            util.format('%s: %s\n', user.provider, user.profileUrl) +
            util.format('email: %s\n\n', email_addresses(user).join(' ')) +
            admin_footer
    };
  },
  new_app: function(user, app) {
    return {
      subject: util.format('%s uploaded %s', user.displayName, app.name),
      body: util.format('%s (%s) uploaded an %s app\n', user.displayName, user.username, app.platform) +
            util.format('%s: %s\n', user.provider, user.profileUrl) +
            util.format('email: %s\n\n', email_addresses(user).join(' ')) +
            util.format('%s (%s)\n', app.name, app.identifier) +
            util.format('%s://%s/app/%s\n', config.host.protocol, config.host.address, app.id) +
            admin_footer
    };
  },
  error: function(url, user, err) {
    return {
      subject: util.format('Error: %s', err.message || err.toString()),
      body: (user ? util.format('User %s (%s) ', user.displayName, user.username) : '') +
            'encountered an uncaught error on page:\n' +
            util.format('%s://%s%s\n', config.host.protocol, config.host.address, url) +
            (user ? util.format('%s: %s\n', user.provider, user.profileUrl) : '') +
            util.format('\n%s\n', err.stack || err.message || err.toString()) +
            admin_footer
    };
  }
}
