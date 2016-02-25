assert = require 'assert'
apps = require '../../model/apps'
Promise = require 'bluebird'

# SUT
model = require '../../model/code'

order_by = (key) ->
  (a, b) ->
    if a[key] < b[key]
      return -1
    else if a[key] > b[key]
      return 1
    else
      return 0


assert_latest_result = (app_id, id, expected) ->
  model.get app_id, id
  .then (c) ->
    assert.deepEqual c.latest_result, expected

assert_app_status = (app_id, expected) ->
  apps.get app_id
  .then (app) ->
    status = [ 'not_run', 'running', 'successful', 'failed' ]
    .reduce (status, key) ->
      if app[key]
        status[key] = app[key].values
      status
    , {}
    assert.deepEqual status, expected

describe 'model/code', ->
  require('./in_memory_db').setup_mocha()
  app_id = undefined

  beforeEach 'create app', ->
    apps.create_empty 'user_id_0'
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
      id = undefined
      model.create app_id
      .then (c) ->
        id = c.id
        model.delete app_id, id
      .then ->
        model.get app_id, id
      .then (c) ->
        assert.equal c, null
        assert_app_status app_id, {}

    it 'gets all code associated with app', ->
      Promise.all [
        model.create app_id
        model.create app_id
        model.create 'some_other_app'
      ]
      .spread (expected_1, expected_2, not_expected) -> [
        [ expected_1, expected_2 ]
        model.get_all app_id
      ]
      .spread (expected, code) ->
        assert.deepEqual(
          expected.sort( order_by 'id' ),
          code.sort( order_by 'id' )
        )

  describe 'set_latest_result', ->
    id = undefined

    beforeEach ->
      model.create(app_id).then (c) ->
        id = c.id

    it 'restarts an existing test', ->
      model.set_latest_result
        code_id: id
        started_at: 67890
        app:
          id: app_id
          name: 'An App'
        success: true
      .then ->
        model.remove_latest_result app_id, id
      .then ->
        model.set_latest_result
          code_id: id
          started_at: 67891
          app:
            id: app_id
            name: 'An App'
      .then ->
        assert_latest_result app_id, id,
          started_at: 67891

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

  describe 'set_os_version', ->
    id = undefined

    beforeEach 'create code', ->
      model.create app_id
      .then (c) ->
        id = c.id

    it 'defaults to undefined', ->
      model.get app_id, id
      .then (code) ->
        assert.equal code.os_version, undefined
