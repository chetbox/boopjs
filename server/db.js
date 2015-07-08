var config = require('config');
var dynasty = require('dynasty')(config.get('dynamodb'));
var _ = require('underscore');

var TABLE_PREFIX = 'chetbot.';
var TABLES = {
  'users': {
    key_schema: {hash: ['id', 'string']},
    throughput: {write: 10, read: 10}
  },
  'apps': {
    key_schema: {hash: ['id', 'string']},
    throughput: {write: 10, read: 10}
  },
  'code': {
    key_schema: {hash: ['id', 'string'], range: ['app_id', 'string']},
    throughput: {write: 10, read: 10}
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
