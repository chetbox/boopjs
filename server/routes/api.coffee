Promise = require 'bluebird'
shortid = require 'shortid'
_ = require 'underscore'
request = require 'request'

db = require.main.require './db'
s3 = require.main.require './model/third-party/s3'
appetizeio = require.main.require './apps/appetizeio'
inject_apk = require.main.require './apps/android/inject-remote-apk'
email = require.main.require './reporting/email'
model =
  users: require.main.require './model/users'
  apps: require.main.require './model/apps'
  code: require.main.require './model/code'
test_runner = require.main.require './test_runner'

middleware = require './middleware'
auth = require './auth'

exports.add_routes = (app) ->

  app.put '/api/v1/user/:user_id/email',
    auth.login_required,
    auth.ensure_logged_in_user('user_id'),
    (req, res, next) ->
      model.users.set_email_enabled req.params.user_id, req.body.address, req.body.enabled == 'true'
      .then ->
        res.sendStatus 200
      .catch next

  app.post '/api/v1/s3/sign_upload',
    auth.login_or_access_token_required,
    (req, res, next) ->
      s3.client_upload_request \
        'chetbot-apps',
        "#{shortid.generate()}/app.apk",
        req.query.file_type
      .then (upload_req) ->
        res.json upload_req
      .catch next

  app.post '/api/v1/app',
    auth.login_required,
    (req, res, next) ->
      # Allow admins to create a new app
      if req.body.as_user
        if !req.user.admin
          res.sendStatus 403
          return
        console.log "Creating app for user #{req.body.as_user} (admin)"
        as_user = null
        return db.users().find req.body.as_user
        .then (as_user) ->
          if !as_user
            throw new Error("User not found: #{req.body.as_user}")

          model.apps.create_empty as_user.id
          .then (new_app) ->
            # Keep existing info (dynasty's .update is broken)
            as_user.apps = _.union as_user.apps, [ new_app.id ]
            db.users().insert as_user
            .then ->
              res.redirect '/app/' + new_app.id
            .catch next

      user_app_url = s3.url(req.body.s3_bucket, req.body.s3_path)
      new_app_id = shortid.generate()

      inject_apk
        s3_src_bucket: req.body.s3_bucket
        s3_src_path: req.body.s3_path
      .spread (apk_info, modified_apk_url) ->
        console.log 'Creating appetize.io app', modified_apk_url
        [
          apk_info
          modified_apk_url
          appetizeio.create_app(modified_apk_url, 'android')
        ]
      .spread (apk_info, modified_apk_url, appetize_resp) ->
        console.log 'Creating app', new_app_id
        app = _.extend {
          id: new_app_id
          admins: [ req.user.id ]
          platform: 'android'
          user_app_url: user_app_url
          app_url: modified_apk_url
          publicKey: appetize_resp.publicKey
          privateKey: appetize_resp.privateKey
          updated_at: Date.now()
        }, apk_info
        [
          db.users().find req.user.id
          app
          db.apps().insert app
          model.code.create new_app_id
        ]
      .spread (user, app, app_inserted, code) ->
        user.apps = _.union(user.apps, [ new_app_id ])
        # Keep existing info (dynasty's .update is broken)
        [
          user
          app
          code
          db.users().insert user
        ]
      .spread (user, app, code) ->
        email.send_to_admins email.message.new_app(user, app)
        # Take the user straight to their first test
        res.json
          app: { id: app.id }
          test: { id: code.id }
      .catch next

  app.put '/api/v1/app/:app_id',
    auth.login_or_access_token_required,
    middleware.check_user_can_access_app 'app_id'
    (req, res, next) ->
      app_id = req.params.app_id

      db.apps().find app_id
      .then (existing_app) ->
        if !existing_app
          throw new Error("App #{app_id} not found")

        # Hack to allow updating an existing app
        if req.body.use_existing == 'true'
          s3_url = existing_app.user_app_url.match /https?:\/\/([^\./]+)\.s3\.amazonaws\.com\/(.*)/
          if s3_url
            req.body.s3_bucket = s3_url[1]
            req.body.s3_path = s3_url[2]
          else
            req.body.url = existing_app.user_app_url

        inject_apk
          s3_src_bucket: req.body.s3_bucket
          s3_src_path: req.body.s3_path
          src_url: req.body.url
        .spread (apk_info, modified_apk_url) ->
          if existing_app.identifier && apk_info.identifier != existing_app.identifier
            throw new Error("Incorrect app identifier: #{apk_info.identifier}")
          console.log 'Updating appetize.io app', modified_apk_url
          [
            apk_info
            modified_apk_url
            appetizeio.update_app existing_app.privateKey, modified_apk_url, 'android'
          ]
        .spread (apk_info, modified_apk_url, appetize_resp) ->
          console.log 'Updating app', app_id
          if existing_app.privateKey and existing_app.privateKey != appetize_resp.privateKey
            throw new Error('New private key does not match existing')
          if existing_app.publicKey and existing_app.publicKey != appetize_resp.publicKey
            throw new Error('New public key does not match existing')
          new_app = _.extend {}, existing_app, apk_info,
            user_app_url: if req.body.s3_path \
              then s3.url(req.body.s3_bucket, req.body.s3_path)
              else req.body.url
            app_url: modified_apk_url
            privateKey: appetize_resp.privateKey # ensure this is set
            publicKey: appetize_resp.publicKey # ensure this is set
            updated_at: Date.now()
          db.apps().insert new_app
        .then ->
          if req.body.skip_tests != 'true'
            return test_runner.run_all app_id
          else
            console.log "Skipping tests for #{app_id}"
        .then ->
          res.sendStatus 200
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
    auth.login_or_access_token_required,
    middleware.check_user_can_access_app 'app_id'
    (req, res, next) ->
      test_runner.run_all req.params.app_id
      .then ->
        res.sendStatus 200
      .catch next
