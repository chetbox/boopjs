assert = require('assert')

# SUT
model = require('../../model/apps')

assert_app = (id, fn) ->
  model.get(id)
  .then fn

assert_status = (id, expected) ->
  assert_app id, (app) ->
    status = [ 'not_run', 'running', 'successful', 'failed' ]
    .reduce (status, key) ->
      if app[key]
        status[key] = app[key].values
      status
    , {}
    assert.deepEqual status, expected

describe 'model/apps', ->
  require('./in_memory_db').setup_mocha()
  app = undefined

  describe 'create and get', ->

    it 'creates an app and gets it', ->
      model.create_empty('user_id_create_and_get')
      .then (app) ->
        model.get app.id
      .then (app) ->
        assert.deepEqual ['user_id_create_and_get'], app.admins
        assert.equal app.platform, 'android'

  describe 'update latest results', ->

    describe 'no code', ->

      beforeEach 'create app', ->
        model.create_empty 'user_id_create_app'
        .then (_app) ->
          app = _app

      it 'marks new code as not run', ->
        model.mark_as_not_run app.id, 'code_id_new'
        .then ->
          assert_status app.id,
            not_run: [ 'code_id_new' ]

    describe 'code not run', ->

      beforeEach 'create app with code (not run)', ->
        model.create_empty 'user_id_create_app_not_run'
        .then (_app) ->
          app = _app
          model.mark_as_not_run app.id, 'code_id_not_run'

      it 'marks as running', ->
        model.update_result
          code_id: 'code_id_not_run'
          started_at: 567890
          app: app
          report: [
            null
            { source: 'one()' }
          ]
        .then ->
          assert_status app.id,
            running: [ 'code_id_not_run' ]

      it 'marks as failed', ->
        model.update_result
          code_id: 'code_id_not_run'
          started_at: 567890
          app: app
          report: [
            null
            { source: 'one()' }
          ]
          error: description: 'Oh noes =('
        .then ->
          assert_status app.id,
            failed: [ 'code_id_not_run' ]

    describe 'code running', ->

      beforeEach 'create app with running code', ->
        model.create_empty('user_id_create_app_running')
        .then (_app) ->
          app = _app
          model.update_result
            code_id: 'code_id_running'
            started_at: 567890
            app: app

      it 'marks as successful', ->
        model.update_result
          code_id: 'code_id_running'
          started_at: 567890
          app: app
          report: [
            null
            { source: 'one()', result: null }
          ]
          success: true
        .then ->
          assert_status app.id,
            successful: [ 'code_id_running' ]

      it 'marks as failed', ->
        model.update_result
          code_id: 'code_id_running'
          started_at: 567890
          app: app
          report: [
            null
            { source: 'one()' }
          ]
          error: description: 'Doh'
        .then ->
          assert_status app.id,
            failed: [ 'code_id_running' ]

    describe 'successful code', ->

      beforeEach 'create app with successful code', ->
        model.create_empty 'user_id_create_app_successful_code'
        .then (_app) ->
          app = _app
          model.update_result
            code_id: 'code_id_successful'
            started_at: 567890
            app: app
            successful: true

      it 'marks code as not run', ->
        model.mark_as_not_run app.id, 'code_id_successful'
        .then ->
          assert_status app.id,
            not_run: [ 'code_id_successful' ]

      it 'marks code as running', ->
        model.update_result
          code_id: 'code_id_successful'
          started_at: 567891
          app: app
        .then ->
          assert_status app.id,
            running: [ 'code_id_successful' ]

      it 'removes code when deleted', ->
        model.remove_code app.id, 'code_id_successful'
        .then ->
          assert_status app.id, {}

  describe 'set pending report', ->

    beforeEach 'create app', ->
      model.create_empty 'user_id_pending_report'
      .then (_app) ->
        app = _app

    it 'sets the report as pending', ->
      model.get_pending_report app.id
      .then (pending) ->
        assert !pending
      model.set_pending_report app.id, true
      .then ->
        model.get_pending_report app.id
      .then (pending) ->
        assert pending

    it 'returns pending report when result updated', ->
      model.set_pending_report app.id, true
      .then ->
        model.update_result
          code_id: 'code_id_pending_report'
          started_at: 567890
          app: app
          report: [
            null
            { source: 'one()', result: null }
          ]
          success: true
      .then (app) ->
        assert app.pending_report

  describe 'set_processing_status', ->
    app = undefined

    beforeEach 'create app', ->
      model.create_empty 'user_set_processing_status'
      .then (_app) ->
        app = _app

    it 'has no processing status', ->
      model.get app.id
      .then (app) ->
        assert !app.processing_status

    it 'sets status', ->
      model.set_processing_status app.id, 'Starting'
      .then ->
        model.get app.id
      .then (app) ->
        assert.equal app.processing_status.progress, 'Starting'
      .then ->
        model.set_processing_status app.id, 'Downloading'
      .then ->
        model.get app.id
      .then (app) ->
        assert.equal app.processing_status.progress, 'Downloading'

  describe 'mark_as_processed', ->
    app = undefined

    beforeEach 'create app', ->
      model.create_empty 'user_mark_as_processed'
      .then (_app) ->
        app = _app
      .then ->
        model.set_processing_status app.id, 'Unprocessed'

    it 'sets status', ->
      model.mark_as_processed app.id
      .then ->
        model.get app.id
      .then (app) ->
        assert !app.processing_status

  describe 'set_processing_error', ->
    app = undefined

    beforeEach 'create app', ->
      model.create_empty 'user_set_processing_error'
      .then (_app) ->
        app = _app
      .then ->
        model.set_processing_status app.id, 'Unprocessed'

    it 'sets processing error', ->
      model.set_processing_error app.id, new Error('Some error')
      .then ->
        model.get app.id
      .then (app) ->
        assert app.processing_status.error, 'Some error'
