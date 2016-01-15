Promise = require 'bluebird'
shortid = require 'shortid'
_ = require 'underscore'

db = require.main.require './db'
s3 = require.main.require './model/third-party/s3'
appetizeio = require.main.require './apps/appetizeio'
inject_s3_apk = require.main.require './apps/android/inject-s3-apk'
email = require.main.require './reporting/email'
model =
  apps: require.main.require './model/apps'
  code: require.main.require './model/code'

middleware = require './middleware'
auth = require './auth'

exports.add_routes = (app) ->

  app.post '/api/v1/s3/sign_upload',
    auth.login_required,
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
      user_apk_url = req.body.app_url
      new_app_id = shortid.generate()

      # Allow admins to create a new app
      if req.body.as_user
        if !req.user.admin
          res.sendStatus 403
          return
        console.log "Creating app #{new_app_id} for user #{req.body.as_user} (admin)"
        as_user = null
        db.users().find req.body.as_user
        .then (u) ->
          if !u
            throw new Error("User not found: #{req.body.as_user}")
          as_user = u
        .then ->
          model.apps.create_empty as_user.id
        .then ->
          # Keep existing info (dynasty's .update is broken)
          as_user.apps = _.union as_user.apps, [ new_app_id ]
          db.users().insert as_user
        .then ->
          res.redirect '/app/' + new_app_id
        .catch next
        return

      inject_s3_apk(user_apk_url)
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
          user_app_url: user_apk_url
          app_url: modified_apk_url
          publicKey: appetize_resp.publicKey
          privateKey: appetize_resp.privateKey
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
      user_apk_url = req.body.app_url

      inject_s3_apk user_apk_url
      .spread (apk_info, modified_apk_url) -> [
        apk_info
        modified_apk_url
        db.apps().find app_id
      ]
      .spread (apk_info, modified_apk_url, existing_app) ->
        # TODO: check that app has the same package name
        console.log 'Updating appetize.io app', modified_apk_url
        [
          apk_info
          modified_apk_url
          existing_app
          appetizeio.update_app existing_app.privateKey, modified_apk_url, 'android'
        ]
      .spread (apk_info, modified_apk_url, existing_app, appetize_resp) ->
        console.log 'Updating app', app_id
        if existing_app.privateKey and existing_app.privateKey != appetize_resp.privateKey
          throw new Error('New private key does not match existing')
        if existing_app.publicKey and existing_app.publicKey != appetize_resp.publicKey
          throw new Error('New public key does not match existing')
        existing_app.user_app_url = user_apk_url
        existing_app.app_url = modified_apk_url
        existing_app.privateKey = appetize_resp.privateKey # ensure this is set
        existing_app.publicKey = appetize_resp.publicKey # ensure this is set
        existing_app = _.extend existing_app, apk_info
        db.apps().insert existing_app
      .then ->
        model.code.get_all req.params.app_id
      .map (code) ->
        model.code.remove_latest_result code.app_id, code.id
      .then ->
        res.sendStatus 200
      .catch next
