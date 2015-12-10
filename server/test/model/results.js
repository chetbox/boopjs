var assert = require('assert');

// SUT
var results = require('../../model/results');

describe('report_from_statements', function() {

  var report_from_statements = results.report_from_statements;

  it('converts no statements to an empty list', function() {
    assert.deepEqual(
      report_from_statements([]),
      []
    );
  });

  it('converts one statement to a list of undefined and the item', function() {
    assert.deepEqual(
      report_from_statements([{line: 1, source: 'one();'}]),
      [null, {source: 'one();'}]
    );
  });

  it('converts two adjacent statements', function() {
    assert.deepEqual(
      report_from_statements([{line: 1, source: 'one();'}, {line: 2, source: 'two();'}]),
      [null, {source: 'one();'}, {source: 'two();'}]
    );
  });

  it('converts non-adjacent statements', function() {
    assert.deepEqual(
      report_from_statements([{line: 1, source: 'one();'}, {line: 4, source: 'four();'}]),
      [null, {source: 'one();'}, null, null, {source: 'four();'}]
    );
  });

  it('preserves all keys', function() {
    assert.deepEqual(
      report_from_statements([{line: 1, a: 'aa', b: 'bb', c: 'cc'}]),
      [null, {a: 'aa', b: 'bb', c: 'cc'}]
    );
  });
});
