var config = require('config');
var dynasty = require('dynasty')(config.get('dynamodb'));
var _ = require('underscore');

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
  'run_tokens': {
    key_schema: {hash: ['endpoint', 'string'], range: ['token', 'string']},
    throughput: {read: 1, write: 1}
  }
};

dynasty.list()
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

_.each(TABLES, function(_, name) {
  exports[name] = function() {
    return dynasty.table(TABLE_PREFIX + name);
  };
});
