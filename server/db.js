var config = require('config');
var dynasty = require('dynasty')(config.get('aws.dynamodb'));
var Promise = require('bluebird');
var _ = require('underscore');
var https = require('https');

var debug = require('debug')('chetbot:' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''));

var TABLES = {
  'users': {
    TableName: 'chetbot.users',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  },
  'apps': {
    TableName: 'chetbot.apps',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  },
  'code': {
    TableName: 'chetbot.code',
    KeySchema: [
      { AttributeName: 'app_id', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'app_id', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  },
  'devices': {
    TableName: 'chetbot.devices',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  },
  'results': {
    TableName: 'chetbot.results',
    KeySchema: [
      { AttributeName: 'code_id', KeyType: 'HASH' },
      { AttributeName: 'started_at', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'code_id', AttributeType: 'S' },
      { AttributeName: 'started_at', AttributeType: 'N' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 4
    }
  },
  'access_tokens': {
    TableName: 'chetbot.access_tokens',
    KeySchema: [
      { AttributeName: 'token', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'token', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    GlobalSecondaryIndexes: [{
      IndexName: 'user_id_index',
      KeySchema: [
        { AttributeName: 'user_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'KEYS_ONLY' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }]
  }
};

// In progress: Migration away from Dyanasty

_.each(TABLES, function(info, name) {
  exports[name] = function() {
    debug(name);
    return dynasty.table(info.TableName);
  };
});


var AWS = require('aws-sdk');
var dynamodb_config = _.extend({}, config.get('dynamodb')); // copy

// node #3692 workaround (https://github.com/nodejs/node/issues/3692)
if (!dynamodb_config.endpoint || dynamodb_config.endpoint.startsWith('https://')) {
  dynamodb_config.httpOptions = {
    agent: new https.Agent({
      secureProtocol: "TLSv1_method"
    })
  };
}

var dynamodb = Promise.promisifyAll( new AWS.DynamoDB(dynamodb_config) );
var doc_client = Promise.promisifyAll( new AWS.DynamoDB.DocumentClient({ service: dynamodb }) );

// Provide a neat, promisified API with TableName already set
// e.g. new_api.devices.put({...})
exports.v2 = Object.keys(TABLES).reduce(function(fns, table_short_name) {
  fns[table_short_name] = ['update', 'put', 'get', 'scan', 'query', 'delete'].reduce(function(fns, fn_name) {
    fns[fn_name] = function(params) {
      debug(TABLES[table_short_name].TableName, fn_name);
      return doc_client[fn_name + 'Async'](_.extend(
        params,
        { TableName: TABLES[table_short_name].TableName }
      ))
      .then(function(result) {
        // Patch 'get' to the return the "Item"
        if (fn_name === 'get') {
          return result.Item;
        }
        return result;
      })
      .catch(function(e) {
        debug('ERROR: Failed operation:', table_short_name, fn_name, params);
        return doc_client.getAsync({
          TableName: TABLES[table_short_name].TableName,
          Key: params.Key
        })
        .then(function(item) {
          debug('To item:', table_short_name, item);
          throw e;
        });
      });
    };
    return fns;
  }, {});
  fns[table_short_name].batch_get = function(query) {
    debug(TABLES[table_short_name].TableName, 'batch_get');
    if (query.length === 0) return Promise.resolve([]);
    var request = { RequestItems: {} };
    request.RequestItems[TABLES[table_short_name].TableName] = query;
    return doc_client.batchGetAsync(request)
    .then(function(response) {
      return response.Responses[TABLES[table_short_name].TableName];
    });
  };
  fns[table_short_name].batch_delete = function(keys) {
    debug(TABLES[table_short_name].TableName, 'batch_delete');
    if (keys.length === 0) return Promise.resolve();
    var request = {};
    request[TABLES[table_short_name].TableName] = keys.map(function(key) {
      return {DeleteRequest: {Key: key}};
    });
    return doc_client.batchWriteAsync({RequestItems: request});
  };
  fns[table_short_name].batch_put = function(items) {
    debug(TABLES[table_short_name].TableName, 'batch_put');
    if (keys.length === 0) return Promise.resolve();
    var request = {};
    request[TABLES[table_short_name].TableName] = items.map(function(item) {
      return {PutRequest: {Item: item}};
    });
    return doc_client.batchWriteAsync({RequestItems: request});
  };
  fns[table_short_name].create_set = doc_client.createSet;
  fns[table_short_name].condition = doc_client.Condition;
  return fns;
}, {});

exports.v2.setup = function() {
  return Promise.map(Object.keys(TABLES), function(short_name) {
    return dynamodb.describeTableAsync({TableName: TABLES[short_name].TableName})
    .catch(function(e) {
      if (e.code !== 'ResourceNotFoundException') {
        throw e;
      }
      return null;
    })
    .then(function(description) {
      return {
        description: description,
        schema: TABLES[short_name]
      }
    });
  })
  .map(function(table) {
    if (!table.description) {
      debug('Creating table ' + table.schema.TableName);
      // Also creates GlobalSecondaryIndexes
      return dynamodb.createTableAsync(table.schema);
    }
  })
  .catch(function(e) {
    console.error(e.stack);
    process.exit(1);
  });
};
