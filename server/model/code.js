var shortid = require('shortid');
var fs = require('fs');
var _ = require('underscore');
var Promise = require('bluebird');

var db = require('../db').v2.code;
var apps = require('./apps');
var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

var welcome_code = fs.readFileSync(__dirname + '/../demos/welcome.js', 'utf8');

exports.get = function(app_id, id) {
  debug('get', app_id, id);
  return db.get({Key: {app_id: app_id, id: id}});
};

exports.get_all = function(app_id) {
  debug('get_all', app_id);
  return db.query({
    KeyConditionExpression: 'app_id = :app_id',
    ExpressionAttributeValues: {
      ':app_id': app_id
    }
  })
  .then(function(c){
    return c.Items;
  });
};

exports.create = function(app_id) {
  debug('create', app_id);
  var item = {
    id: shortid.generate(),
    name: 'Untitled test',
    app_id: app_id,
    content: welcome_code
  };
  return db.put({Item: item})
  .then(function() {
    return apps.mark_as_not_run(item.app_id, item.id);
  })
  .then(function() {
    return item;
  });
};

exports.set_latest_result = function(result) {
  debug('set_latest_result', result.code_id, result.started_at);
  return db.update({
    Key: {app_id: result.app.id, id: result.code_id},
    UpdateExpression: 'SET latest_result = :result',
    ConditionExpression: 'attribute_not_exists(latest_result) OR attribute_type(latest_result, :null_type) OR latest_result.started_at <= :started_at',
    ExpressionAttributeValues: {
      ':result': _.pick(result, ['started_at', 'success', 'error']),
      ':started_at': result.started_at,
      ':null_type': 'NULL'
    }
  })
  .then(function() {
    return apps.update_result(result);
  });
};

exports.remove_latest_result = function(app_id, id) {
  debug('remove_latest_result', app_id, id);
  return Promise.join(
    db.update({
      Key: {app_id: app_id, id: id},
      UpdateExpression: 'SET latest_result = :empty',
      ExpressionAttributeValues: {
        ':empty': null
      }
    }),
    apps.mark_as_not_run(app_id, id)
  );
}

exports.delete = function(app_id, id) {
  debug('delete', app_id, id);
  return db.delete({Key: {app_id: app_id, id: id}})
  .then(function() {
    return apps.remove_code(app_id, id);
  });
};
