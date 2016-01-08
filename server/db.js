var config = require('config');
var dynasty = require('dynasty')(config.get('aws.dynamodb'));
var _ = require('underscore');
var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

var TABLE_PREFIX = 'chetbot.';
var TABLES = {
  'users': {
    key_schema: {hash: ['id', 'string']},
    throughput: {write: 1, read: 1}
  },
  'apps': {
    key_schema: {hash: ['id', 'string']},
    throughput: {write: 1, read: 1}
  },
  'code': {
    key_schema: {hash: ['app_id', 'string'], range: ['id', 'string']},
    throughput: {write: 1, read: 1}
  },
  'devices': {
    key_schema: {hash: ['id', 'string']},
    throughput: {read: 1, write: 1}
  },
  'results': {
    key_schema: {hash: ['code_id', 'string'], range: ['started_at', 'number']},
    throughput: {write: 4, read: 1}
  }
};

exports.setup = function() {
  return dynasty.list()
  .then(function(data) {
    return Promise.all(
      _.map(TABLES, function(options, name) {
        var full_name = TABLE_PREFIX + name;
        if (data.TableNames.indexOf(full_name) === -1) {
          return dynasty.create(full_name, options);
        }
      })
    );
  })
  .catch(function(e) {
    console.error(e.stack);
    process.exit(1);
  });
}

_.each(TABLES, function(_, name) {
  exports[name] = function() {
    debug(name);
    return dynasty.table(TABLE_PREFIX + name);
  };
});

// In progress: Migration away from Dyanasty

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB.DocumentClient(config.get('aws.dynamodb'));
require('bluebird').promisifyAll(Object.getPrototypeOf(dynamodb));

// Provide a neat, promisified API with TableName already set
// e.g. new_api.devices.put({...})
exports.v2 = Object.keys(TABLES).reduce(function(fns, table_short_name) {
  fns[table_short_name] = ['update', 'put', 'get', 'scan', 'query', 'delete'].reduce(function(fns, fn_name) {
    fns[fn_name] = function(params) {
      debug(TABLE_PREFIX + table_short_name, fn_name);
      return dynamodb[fn_name + 'Async'](_.extend(
        params,
        { TableName: TABLE_PREFIX + table_short_name }
      ))
      .then(function(result) {
        // Patch 'get' to the return the "Item"
        if (fn_name === 'get') {
          return result.Item;
        }
        return result;
      });
    };
    return fns;
  }, {});
  return fns;
}, {});
