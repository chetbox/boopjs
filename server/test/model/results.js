var assert = require('assert');

var spawn = require('child_process').spawn;
var DYNAMODB_LOCAL = process.env.DYNAMODB_LOCAL
  || 'dynamodb-local';

var db_process;
var db;
var results;

function assert_items(expected) {
  return db.results.scan({})
  .then(function(results) {
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
var REPORT = {
  EMPTY: [
    null
  ],
  NOT_RUN: [
    null,
    {source: 'one()'},
    null,
    {source: 'three()'}
  ],
  LINE_1_SUCCESSFUL: [
    null,
    {source: 'one()', success: {result: 'First.'}},
    null,
    {source: 'three()'}
  ],
  LINE_1_FAILED: [
    null,
    {source: 'one()', error: {description: 'Error one', stracktrace: 'trace'}},
    null,
    {source: 'three()'}
  ],
  LINE_3_SUCCESSFUL: [
    null,
    {source: 'one()', success: {result: 'First.'}},
    null,
    {source: 'three()', success: {result: 'Third.'}}
  ]
};

describe('model.results', function() {

  before(function(done) {
    db_process = spawn(DYNAMODB_LOCAL, ['-inMemory', '-port', '8765'], {
      detached: true
    });
    setTimeout(done, 250);
  });

  beforeEach(function(done) {
    db = require('../../db');
    db.setup()
    .then(function() {
      results = require('../../model/results');
      db = db.v2;
      done()
    });
  });

  afterEach(function(done) {
    return db.results.scan({})
    .then(function(rs) {
      return rs.Items.map(function(r) {
        return db.results.delete({Key: results.key(r)});
      })
    })
    .then(function() {
      db = undefined;
      results = undefined;
      done();
    });
  });

  after(function() {
    results = undefined;
    // See http://azimi.me/2014/12/31/kill-child_process-node-js.html
    process.kill(-db_process.pid);
    db_process = undefined;
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

    it('"create" (returns key) then "get"', function(done) {
      results.create('code_one', 456789, APP)
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
      })
      .then(done);
    });

  });

  describe('update results', function() {

    it('successful empty test', function(done) {
      var key;
      results.create('code_empty_test', 123456, APP)
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
      })
      .then(done);
    });

    it('unhandled exception', function(done) {
      var key;
      results.create('code_unhandled_exception', 123456, APP)
      .then(function(_key) {
        key = _key;
        return results.set_report(key, [null])
      })
      .then(function() {
        return results.update(key, {error: 'Unhandled', stacktrace: 'Unhandled\nException'});
      })
      .then(function() {
        return assert_items([{
          code_id: 'code_unhandled_exception',
          started_at: 123456,
          app: APP,
          report: [null],
          error: {description: 'Unhandled', stacktrace: 'Unhandled\nException'}
        }]);
      })
      .then(done);
    });

    it('successful test run', function(done) {
      var key;
      results.create('code_successful', 123456, APP)
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
          results.update(key, {line: 3, result: 'third---'})
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
            {source: 'three()', success: {result: 'third---'}}
          ],
          success: true
        }]);
      })
      .then(done);
    });

  });

});
