var Promise = require('bluebird');
var shortid = require('shortid');

var db = require('../db');

// TODO: delete devices when inactive

exports.create_device = function(options) {
  var device_id = shortid.generate();
  return db.devices().insert({
    id: device_id,
    users: options.user ? [options.user.id] : 0,
    skip_auth: options.user === null ? 1 : 0
  })
  .then(function() {
    return device_id;
  });
};

exports.check_device_exists = function(device_id) {
  if (!device_id) {
    return Promise.reject('Device not specified');
  }
  return db.devices().find(device_id)
  .then(function(device) {
    if (!device) {
      throw new Error('Device not found: ' + device_id);
    }
    return device;
  });
};

exports.check_device_access = function(device_id, user) {
  return exports.check_device_exists(device_id)
  .then(function(device) {
    if (device.skip_auth) {
      return device;
    }

    if (!user) {
      throw new Error('Not logged in');
    }

    if (device.users && device.users.indexOf(user.id) >= 0) {
      return device;
    }

    throw new Error('User cannot access this device');
  });
};
