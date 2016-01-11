var net = require('net');
var spawn = require('child_process').spawn;
var Promise = require('bluebird');

var db = require('../../db');
var results = require('../../model/results');

var DYNAMODB_LOCAL = process.env.DYNAMODB_LOCAL
  || 'dynamodb-local';

var port_available = function(port, fn) {
  var tester = net.createServer()
  .once('error', function (err) {
    if (err.code != 'EADDRINUSE') return fn(err)
    fn(null, true)
  })
  .once('listening', function() {
    tester.once('close', function() { fn(null, false) })
    .close()
  })
  .listen(port);
};

exports.setup_mocha = function() {

  var db_process;

  before('start in-memory dynamodb-local', function(done) {
    var dynamo_db_local = DYNAMODB_LOCAL.split(' ')[0],
        dynamo_db_local_args = DYNAMODB_LOCAL.split(' ').slice(1);
    db_process = spawn(dynamo_db_local, dynamo_db_local_args.concat(['-inMemory', '-port', '8765']), {
      detached: true
    });
    var check_started = setInterval(function() {
      port_available(8765, function(err) {
        if (!err) {
          clearInterval(check_started);
          done();
        }
      });
    }, 100);
  });

  after('stop dynamodb-local', function() {
    // See http://azimi.me/2014/12/31/kill-child_process-node-js.html
    process.kill(-db_process.pid);
    db_process = undefined;
  });

  beforeEach('setup database', function() {
    this.timeout(10000);
    return db.setup();
  });

  afterEach('delete all items', function() {
    return Promise.join(
      db.v2.results.scan({AttributesToGet: ['code_id', 'started_at']}),
      db.v2.code.scan({AttributesToGet: ['app_id', 'id']})
    )
    .spread(function(r, c) {
      return [
        db.v2.results.batch_delete(r.Items),
        db.v2.code.batch_delete(c.Items)
      ];
    });
  });

}
