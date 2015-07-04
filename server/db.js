var config = require('config');
var dynasty = require('dynasty')(config.get('dynamodb'));

var USERS = 'chetbot.users';
var CODE  = 'chetbot.code';

dynasty.list()
  .then(function(data) {
    // TODO: use .all for all 'create' promises and log output
    if (data.TableNames.indexOf(USERS) === -1) {
      dynasty.create(USERS, {
        key_schema: {hash: ['id', 'string']},
        throughput: {write: 10, read: 10}
      });
    }
    if (data.TableNames.indexOf(CODE) === -1) {
      dynasty.create(CODE, {
        key_schema: {hash: ['id', 'string']},
        throughput: {write: 10, read: 10}
      });
    }
  })
  .catch(function(e) {
    console.error(e);
    process.exit(1);
  });

exports.users = function() { return dynasty.table(USERS); };
exports.code  = function() { return dynasty.table(CODE); };
