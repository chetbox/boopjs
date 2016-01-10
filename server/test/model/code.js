var assert = require('assert');
var in_memory_db = require('./in_memory_db');

var db = require('../../db').v2;

function assert_latest_result(app_id, id, expected) {
  return db.code.get({Key: {app_id: app_id, id: id}})
  .then(function(c) {
    assert.deepEqual(expected, c.latest_result);
  });
}

describe('model/code', function() {

  in_memory_db.setup_mocha();

  var model = require('../../model/code');

  describe('create and get', function() {

    it('creates empty code then retrieve', function() {
      return model.create('app_id_empty_code')
      .then(function(c) {
        return model.get('app_id_empty_code', c.id);
      })
      .then(function(c) {
        assert.equal('app_id_empty_code', c.app_id);
        assert.equal('Untitled test', c.name);
        assert('string', typeof(c.content)); // Welcome code
      });
    });

  });

  describe('set_latest_result', function() {

    var app_id = 'app_id_set_latest_result';
    var id;

    beforeEach(function() {
      return model.create(app_id)
      .then(function(c) {
        id = c.id;
      });
    });

    it('successful test', function() {
      return model.set_latest_result({
        code_id: id,
        started_at: 67890,
        app: {id: app_id, name: 'An App'}
      })
      .then(function() {
        return assert_latest_result(app_id, id, {
          started_at: 67890
        });
      })
      .then(function() {
        return model.set_latest_result({
          code_id: id,
          started_at: 67890,
          app: {id: app_id, name: 'An App'},
          success: true
        });
      })
      .then(function() {
        return assert_latest_result(app_id, id, {
          started_at: 67890,
          success: true
        });
      });
    });

    it('failed test', function() {
      return model.set_latest_result({
        code_id: id,
        started_at: 67890,
        app: {id: app_id, name: 'An App'}
      })
      .then(function() {
        return assert_latest_result(app_id, id, {
          started_at: 67890
        });
      })
      .then(function() {
        return model.set_latest_result({
          code_id: id,
          started_at: 67890,
          app: {id: app_id, name: 'An App'},
          success: false,
          error: {description: 'Something broke'}
        });
      })
      .then(function() {
        return assert_latest_result(app_id, id, {
          started_at: 67890,
          success: false,
          error: {description: 'Something broke'}
        });
      });
    });

    it('cannot update with old result', function(done) {
      return model.set_latest_result({
        code_id: id,
        started_at: 67890,
        app: {id: app_id, name: 'An App'}
      })
      .then(function() {
        return assert_latest_result(app_id, id, {
          started_at: 67890
        });
      })
      .then(function() {
        return model.set_latest_result({
          code_id: id,
          started_at: 67889,
          app: {id: app_id, name: 'An App'},
          success: true
        });
      })
      .catch(function(err) {
        assert(err);
        done();
      });
    });

  });

});
