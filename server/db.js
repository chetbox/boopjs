var config = require('config');
var dynasty = require('dynasty')(config.get('dynamodb'));

var USERS = 'chetbot.users';

dynasty.list()
  .then(function(data) {
    if (data.TableNames.indexOf(USERS) === -1) {
      return dynasty.create(USERS, {
        key_schema: {hash: ['id', 'string']},
        throughput: {write: 10, read: 10}
      });
    }
  })
  .then(function(data) {
    if (data) {
      console.log(data);
    }
  })
  .catch(function(e) {
    console.log('table creation failed')
    console.error(e);
    process.exit(1);
  });

exports.users = function() { return dynasty.table(USERS); };
