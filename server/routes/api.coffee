Promise = require 'bluebird'
shortid = require 'shortid'
request = require 'request'

s3 = require.main.require './model/third-party/s3'
inject_apk = require.main.require './inject-remote-apk'
model =
  users: require.main.require './model/users'
  apps: require.main.require './model/apps'
  code: require.main.require './model/code'
test_runner = require.main.require './test_runner'

middleware = require './middleware'
auth = require './auth'

exports.add_routes = (app) ->

  app.put '/api/v1/user/:user_id/email',
    auth.login_required
    auth.ensure_logged_in_user('user_id')
    (req, res, next) ->
      model.users.set_email_enabled req.params.user_id, req.body.address, req.body.enabled == 'true'
      .then ->
        res.sendStatus 200
      .catch next

  app.post '/api/v1/s3/sign_upload',
    auth.login_or_access_token_required
    (req, res, next) ->
      s3.client_upload_request \
        'chetbot-apps',
        "#{shortid.generate()}/app.apk",
        req.query.file_type
      .then (upload_req) ->
        res.json upload_req
      .catch next

  app.post '/api/v1/app',
    auth.login_required
    (req, res, next) ->
      # Admins can pass as_user to perform action on behalf of another user
      if req.body.as_user && !req.user.admin
        res.sendStatus 403

      user_id = req.body.as_user || req.user.id
      model.apps.create_empty user_id
      .then (new_app) ->
        Promise.join \
          new_app,
          model.code.create new_app.id,
          model.users.grant_access_to_app user_id, new_app.id
      .spread (new_app, new_code) ->
        if (req.body.s3_bucket && req.body.s3_path)
          inject_apk.add_s3_file_to_queue user_id, new_app.id, req.body.s3_bucket, req.body.s3_path
        res.json
          app: { id: new_app.id }
          test: { id: new_code.id }
      .catch next

  app.get '/api/v1/app/:app_id/processing-status',
    auth.login_required
    middleware.check_user_can_access_app 'app_id'
    (req, res, next) ->
      model.apps.get req.params.app_id
      .then (app) ->
        if app.processing_status
          res.status 202
          .json
            ready: false
            progress: app.processing_status.progress
            error: app.processing_status.error
        else
          res.status 200
          .json { ready: true }

  app.put '/api/v1/app/:app_id',
    auth.login_or_access_token_required
    middleware.check_user_can_access_app 'app_id'
    (req, res, next) ->
      model.apps.get req.params.app_id
      .then (existing_app) ->
        if !existing_app
          throw new Error("App #{req.params.app_id} not found")

        # Hack to allow updating an existing app
        if req.body.use_existing == 'true'
          s3_url = existing_app.user_app_url.match /https?:\/\/([^\./]+)\.s3\.amazonaws\.com\/(.*)/
          if s3_url
            req.body.s3_bucket = s3_url[1]
            req.body.s3_path = s3_url[2]
          else
            req.body.url = existing_app.user_app_url

        options = { run_tests: !req.body.skip_tests }
        if req.body.url
          inject_apk.add_public_url_to_queue req.user.id, req.params.app_id, req.body.url, options
        else
          inject_apk.add_s3_file_to_queue req.user.id, req.params.app_id, req.body.s3_bucket, req.body.s3_path, options
        res.sendStatus 202
      .catch next

  app.get /\/api\/v1\/app\/([^\/]*?)\/badge\.(svg|png|json)/,
    (req, res, next) ->
      model.apps.get req.params[0]
      .then (app) ->
        successful = if app.successful then app.successful.values.length else 0
        total = [ 'failed', 'running', 'successful', 'not_run' ].reduce (total, key) ->
          total + (if app[key] then app[key].values.length else 0)
        , 0
        status_text = [ 'successful', 'running', 'not_run', 'failed' ].reduce (status_text, key) ->
          if app[key] then key else status_text
        , 'not_run'
        color = {
          failed: 'red'
          successful: 'green'
          running: 'blue'
          not_run: 'lightgrey'
        }[status_text]
        request "https://img.shields.io/badge/boop.js-#{app.version.replace(/^v?/,'v')}%20#{status_text.replace '_', ' '}%20(#{successful}/#{total} passed)-#{color}.#{req.params[1]}"
        .pipe res
      .catch next

  # Run all tests - handy for testing
  app.post '/api/v1/app/:app_id/run',
    auth.login_or_access_token_required
    middleware.check_user_can_access_app 'app_id'
    (req, res, next) ->
      test_runner.run_all req.params.app_id
      .then ->
        res.sendStatus 200
      .catch next
