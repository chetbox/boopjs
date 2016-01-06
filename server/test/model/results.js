var assert = require('assert');

var spawn = require('child_process').spawn;
var DYNAMODB_LOCAL = process.env.DYNAMODB_LOCAL
  || 'dynamodb-local';

var db_process;
var db;
var results;

function assert_items(expected) {
  var r;
  return db.results.scan({})
  .then(function(results) {
    r = results;
    assert.deepEqual(results.Items, expected)
  });
}

function assert_report(key, expected) {
  return db.results.get({Key: key})
  .then(function(result) {
    assert.deepEqual(result.report, expected)
  });
}

var APP = { id: 'app7890', name: 'Antelope' };

describe('model.results', function() {

  before(function(done) {
    var dynamo_db_local = DYNAMODB_LOCAL.split(' ')[0],
        dynamo_db_local_args = DYNAMODB_LOCAL.split(' ').slice(1);
    db_process = spawn(dynamo_db_local, dynamo_db_local_args.concat(['-inMemory', '-port', '8765']), {
      detached: true
    });
    setTimeout(done, 500);
  });

  after(function() {
    results = undefined;
    // See http://azimi.me/2014/12/31/kill-child_process-node-js.html
    process.kill(-db_process.pid);
    db_process = undefined;
  });

  beforeEach(function() {
    db = require('../../db');
    return db.setup()
    .then(function() {
      results = require('../../model/results');
      db = db.v2;
    });
  });

  afterEach(function() {
    return db.results.scan({})
    .then(function(rs) {
      return rs.Items.map(function(r) {
        return db.results.delete({Key: results.key(r)});
      })
    })
    .then(function() {
      db = undefined;
      results = undefined;
    });
  });

  describe('report_from_statements', function() {
    console.log('report_from_statements');

    it('converts no statements to an empty list', function() {
      assert.deepEqual(
        results.report_from_statements([]),
        []
      );
    });

    it('converts one statement to a list of undefined and the item', function() {
      assert.deepEqual(
        results.report_from_statements([{line: 1, source: 'one();'}]),
        [null, {source: 'one();'}]
      );
    });

    it('converts two adjacent statements', function() {
      assert.deepEqual(
        results.report_from_statements([{line: 1, source: 'one();'}, {line: 2, source: 'two();'}]),
        [null, {source: 'one();'}, {source: 'two();'}]
      );
    });

    it('converts non-adjacent statements', function() {
      assert.deepEqual(
        results.report_from_statements([{line: 1, source: 'one();'}, {line: 4, source: 'four();'}]),
        [null, {source: 'one();'}, null, null, {source: 'four();'}]
      );
    });

    it('preserves all keys', function() {
      assert.deepEqual(
        results.report_from_statements([{line: 1, a: 'aa', b: 'bb', c: 'cc'}]),
        [null, {a: 'aa', b: 'bb', c: 'cc'}]
      );
    });

  });

  describe('create, get', function() {

    it('"create" (returns key) then "get"', function() {
      return results.create('code_one', 456789, APP)
      .then(function(key) {
        assert.deepEqual(key, { code_id: 'code_one', started_at: 456789 });
      })
      .then(function() {
        return assert_items([{ code_id: 'code_one', started_at: 456789, app: APP }]);
      })
      .then(function() {
        return results.get('code_one', 456789);
      })
      .then(function(result) {
        assert.deepEqual(result, { code_id: 'code_one', started_at: 456789, app: APP });
      });
    });

  });

  describe('updating results', function() {

    it('successful empty test', function() {
      var key;
      return results.create('code_empty_test', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [null])
      })
      .then(function() {
        return results.update(key, {success: true});
      })
      .then(function() {
        return assert_items([{
          code_id: 'code_empty_test',
          started_at: 123456,
          app: APP,
          report: [null],
          success: true
        }]);
      });
    });

    it('unhandled exception', function() {
      var key;
      return results.create('code_unhandled_exception', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [null])
      })
      .then(function() {
        return results.update(key, {device: null, error: 'forced crash', stacktrace: 'java.lang.RuntimeException', type: 'unhandled'});
      })
      .then(function() {
        return assert_items([{
          code_id: 'code_unhandled_exception',
          started_at: 123456,
          app: APP,
          report: [null],
          error: {description: 'forced crash', stacktrace: 'java.lang.RuntimeException'}
        }]);
      });
    });

    it('successful test run', function() {
      var key;
      return results.create('code_successful', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [
          null,
          {source: 'one()'},
          null,
          {source: 'three()'}
        ]);
      })
      .then(function() {
        return [
          results.update(key, {line: 1, result: 'First.'}),
          results.update(key, {line: 3, result: ['Th', 'ir', 'd']})
        ];
      })
      .spread(function() {
        return results.update(key, {success: true});
      })
      .then(function() {
        return assert_items([{
          code_id: 'code_successful',
          started_at: 123456,
          app: APP,
          report: [
            null,
            {source: 'one()', success: {result: 'First.'}},
            null,
            {source: 'three()', success: {result: ['Th', 'ir', 'd']}}
          ],
          success: true
        }]);
      });
    });

    it('error executing line', function() {
      var key;
      return results.create('code_line_error', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [
          null,
          {source: 'one()'},
          {source: 'two()'},
          {source: 'three()'}
        ]);
      })
      .then(function() {
        return [
          results.update(key, {line: 1, result: 'First.'}),
          results.update(key, {line: 2, error: 'Error on line 2', stacktrace: 'Line 2\nError'})
        ];
      })
      .spread(function() {
        return results.update(key, {success: false});
      })
      .then(function() {
        return assert_items([{
          code_id: 'code_line_error',
          started_at: 123456,
          app: APP,
          report: [
            null,
            {source: 'one()', success: {result: 'First.'}},
            {source: 'two()', error: {description: 'Error on line 2', stacktrace: 'Line 2\nError'}},
            {source: 'three()'}
          ],
          error: {description: 'Error on line 2', stacktrace: 'Line 2\nError', line: 2, source: 'two()'}
        }]);
      });
    });

    it('update received after a test has succeeded', function() {
      var key;
      return results.create('code_update_successful', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [
          null,
          {source: 'one()'}
        ]);
      })
      .then(function() { return results.update(key, {success: true}); })
      .then(function() { return results.update(key, {line: 1, result: null, type: 'NULL'}); })
      .then(function() {
        return assert_items([{
          code_id: 'code_update_successful',
          started_at: 123456,
          app: APP,
          report: [
            null,
            {source: 'one()', success: {result: null, type: 'NULL'}}
          ],
          success: true
        }]);
      });
    });

    it('update received after a test has already failed', function() {
      var key;
      return results.create('code_update_failed', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [
          null,
          {source: 'one()'}
        ]);
      })
      .then(function() { return results.update(key, {error: 'Things went down', stacktrace: 'Bad things'}); })
      .then(function() { return results.update(key, {line: 1, result: null, type: 'NULL'}); })
      .then(function() {
        return assert_items([{
          code_id: 'code_update_failed',
          started_at: 123456,
          app: APP,
          report: [
            null,
            {source: 'one()', success: {result: null, type: 'NULL'}}
          ],
          error: {description: 'Things went down', stacktrace: 'Bad things'}
        }]);
      });
    });


    describe('failure cases', function() {

      it('finishing an already successful test', function(done) {
        var key;
        results.create('code_finish_twice_success', 123456, APP)
        .then(function(_key) {
          key = _key;
          return results.set_report(key, [null]);
        })
        .then(function() { return results.update(key, {success: true}); })
        // Successful again?!
        .then(function() { return results.update(key, {success: true}); })
        .then(function() { done('Expecting an update error'); })
        .catch(function(e) { assert(e instanceof Error); })
        // An error?! We already finished successfully dammit!
        .then(function() { return results.update(key, {error: 'Uh oh', stacktrace: 'Bad things happened'}); })
        .then(function() { done('Expecting an update error'); })
        .catch(function(e) { assert(e instanceof Error); })
        .then(done);
      });

      it('finishing an already failed test', function(done) {
        var key;
        results.create('code_finish_twice_error', 123456, APP)
        .then(function(_key) {
          key = _key;
          return results.set_report(key, [null]);
        })
        .then(function() { return results.update(key, {error: 'Things went wrong', stacktrace: 'This wasn\'t planned'}); })
        // Now it's successful?!
        .then(function() { return results.update(key, {success: true}); })
        .then(function() { done('Expecting an update error'); })
        .catch(function(e) { assert(e instanceof Error); })
        // Another error?! We already finished! How dare you.
        .then(function() { return results.update(key, {error: 'Uh oh', stacktrace: 'Bad things happened'}); })
        .then(function() { done('Expecting an update error'); })
        .catch(function(e) { assert(e instanceof Error); })
        .then(done);
      });

      it('the same line is successful twice', function(done) {
        var key;
        results.create('code_update_line_twice_success', 123456, APP)
        .then(function(_key) {
          key = _key;
          return results.set_report(key, [
            null,
            {source: 'one()'}
          ]);
        })
        .then(function() { return results.update(key, {line: 1, result: 'first'}); })
        // Another result from the same line?!
        .then(function() { return results.update(key, {line: 1, result: 'second'}); })
        .then(function() { done('Expecting an update error'); })
        .catch(function(e) { assert(e instanceof Error); })
        .then(function() {
          return assert_items([{
            code_id: 'code_update_line_twice_success',
            started_at: 123456,
            app: APP,
            report: [
              null,
              {source: 'one()', success: {result: 'first'}}
            ]
          }])
        })
        .then(done);
      });

      it('updating the same line twice', function(done) {
        var key;
        results.create('code_update_line_twice', 123456, APP)
        .then(function(_key) {
          key = _key;
          return results.set_report(key, [
            null,
            {source: 'one()'}
          ]);
        })
        .then(function() { return results.update(key, {line: 1, error: 'first', stacktrace: '1111'}); })
        // Another error from the same line?!
        .then(function() { return results.update(key, {line: 1, error: 'second', stacktrace: '2222'}); })
        .then(function() { done('Expecting an update error'); })
        .catch(function(e) { assert(e instanceof Error); })
        .then(function() {
          return assert_items([{
            code_id: 'code_update_line_twice',
            started_at: 123456,
            app: APP,
            report: [
              null,
              {source: 'one()', error: {description: 'first', stacktrace: '1111'}}
            ],
            error: {description: 'first', stacktrace: '1111', line: 1, source: 'one()'}
          }])
        })
        .then(done);
      });

    });
  });
});
