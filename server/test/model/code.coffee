assert = require('assert')
apps = require('../../model/apps')

# SUT
model = require('../../model/code')

assert_latest_result = (app_id, id, expected) ->
  model.get app_id, id
  .then (c) ->
    assert.deepEqual expected, c.latest_result

assert_app_status = (app_id, expected) ->
  apps.get app_id
  .then (app) ->
    status = [ 'not_run', 'running', 'successful', 'failed' ]
    .reduce (status, key) ->
      if app[key]
        status[key] = app[key].values
      status
    , {}
    assert.deepEqual expected, status

describe 'model/code', ->
  require('./in_memory_db').setup_mocha()
  app_id = undefined

  beforeEach 'create app', ->
    apps.create 'user_id_0'
    .then (app) ->
      app_id = app.id

  describe 'create, get, delete', ->

    it 'creates empty code then retrieves it', ->
      model.create app_id
      .then (c) ->
        model.get app_id, c.id
      .then (c) ->
        assert.equal app_id, c.app_id
        assert.equal 'Untitled test', c.name
        assert 'string', typeof c.content # Welcome code
        assert_app_status app_id,
          not_run: [ c.id ]

    it 'creates code then deletes it', ->
      model.create app_id
      .then (c) ->
        model.delete app_id, c.id
        c.id
      .then (id) ->
        model.get app_id, id
      .then (c) ->
        assert.equal null, c
        assert_app_status app_id, {}

  describe 'set_latest_result', ->
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
      .then -> [
        assert_latest_result app_id, id,
          started_at: 67890
          success: true
        assert_app_status app_id,
          successful: [ id ]
      ]

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
      .then -> [
        assert_latest_result app_id, id,
          started_at: 67890
          success: false
          error: description: 'Something broke'
        assert_app_status app_id,
          failed: [ id ]
      ]

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

  describe 'remove_latest_result', ->
    id = undefined

    beforeEach ->
      model.create app_id
      .then (c) ->
        id = c.id
      .then ->
        model.set_latest_result
          code_id: id
          started_at: 67890
          app:
            id: app_id
            name: 'An App'
          success: true

    it 'removes latest result', ->
      model.remove_latest_result app_id, id
      .then -> [
        assert_latest_result app_id, id, null
        assert_app_status app_id,
          not_run: [ id ]
      ]
