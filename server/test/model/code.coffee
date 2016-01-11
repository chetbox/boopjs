assert = require('assert')
db = require('../../db').v2

assert_latest_result = (app_id, id, expected) ->
  db.code.get(Key:
    app_id: app_id
    id: id).then (c) ->
    assert.deepEqual expected, c.latest_result

describe 'model/code', ->
  require('./in_memory_db').setup_mocha()
  model = require('../../model/code')

  describe 'create and get', ->
    it 'creates empty code then retrieve', ->
      model.create 'app_id_empty_code'
      .then (c) ->
        model.get 'app_id_empty_code', c.id
      .then (c) ->
        assert.equal 'app_id_empty_code', c.app_id
        assert.equal 'Untitled test', c.name
        assert 'string', typeof c.content # Welcome code

  describe 'set_latest_result', ->
    app_id = 'app_id_set_latest_result'
    id = undefined

    beforeEach ->
      model.create(app_id).then (c) ->
        id = c.id

    it 'successful test', ->
      model.set_latest_result
        code_id: id
        started_at: 67890
        app:
          id: app_id
          name: 'An App'
      .then ->
        assert_latest_result app_id, id, started_at: 67890
      .then ->
        model.set_latest_result
          code_id: id
          started_at: 67890
          app:
            id: app_id
            name: 'An App'
          success: true
      .then ->
        assert_latest_result app_id, id,
          started_at: 67890
          success: true

    it 'failed test', ->
      model.set_latest_result
        code_id: id
        started_at: 67890
        app:
          id: app_id
          name: 'An App'
      .then ->
        assert_latest_result app_id, id, started_at: 67890
      .then ->
        model.set_latest_result
          code_id: id
          started_at: 67890
          app:
            id: app_id
            name: 'An App'
          success: false
          error: description: 'Something broke'
      .then ->
        assert_latest_result app_id, id,
          started_at: 67890
          success: false
          error: description: 'Something broke'

    it 'cannot update with old result', (done) ->
      model.set_latest_result
        code_id: id
        started_at: 67890
        app:
          id: app_id
          name: 'An App'
      .then ->
        assert_latest_result app_id, id, started_at: 67890
      .then ->
        model.set_latest_result
          code_id: id
          started_at: 67889
          app:
            id: app_id
            name: 'An App'
          success: true
      .then ->
        done 'Expected an error updating with old result'
      .catch (err) ->
        done()
