assert = require 'assert'
Promise = require 'bluebird'

db = require('../../db').v2.users

# SUT
model = require '../../model/users'

describe 'model/users', ->
  require('./in_memory_db').setup_mocha()

  describe 'emails_for_users', ->

    it 'gets emails for some users', ->
      Promise.join(
        model.add
          id: 'user_email_1'
          emails:
            'one@example.com': { verified: true }
        model.add
          id: 'user_email_2'
          emails:
            'two@example.com': { verified: true, primary: true }
            'too@example.com': { verified: true }
        model.add
          id: 'user_email_3'
          emails: {}
        model.add { id: 'user_email_4' }
      )
      .then ->
        model.emails_for_users [ 'user_email_1', 'user_email_2', 'user_email_3' ]
      .then (emails) ->
        assert.deepEqual emails.sort(),
          [ 'one@example.com', 'too@example.com', 'two@example.com' ]

    it 'ignores disabled email addresses', ->
      model.add
        id: 'user_email_ignored'
        emails:
          'mememe@example.com': { verified: true }
          'ignoreme@example.com': { verified: true, disabled: true }
      .then ->
        model.emails_for_users [ 'user_email_ignored' ]
      .then (emails) ->
        assert.deepEqual emails, [ 'mememe@example.com' ]

  describe 'set_email_enabled', ->

    it 'disables new email', ->
      model.add
        id: 'user_disable_email'
        emails:
          'byebye@example.com': { verified: true }
      .then ->
        model.set_email_enabled 'user_disable_email', 'byebye@example.com', false
      .then ->
        model.get 'user_disable_email'
      .then (user) ->
        assert.deepEqual user.emails,
          'byebye@example.com': { verified: true, disabled: true }

    it 'enables disabled email', ->
      model.add
        id: 'user_enable_email'
        emails:
          'hello@example.com': { verified: true, disabled: true }
      .then ->
        model.set_email_enabled 'user_enable_email', 'hello@example.com', true
      .then ->
        model.get 'user_enable_email'
      .then (user) ->
        assert.deepEqual user.emails,
          'hello@example.com': { verified: true }

  describe 'grant_access_to_app', ->

    it 'adds apps to existing user', ->
      model.add
        id: 'user_grant_access'
      .then ->
        model.grant_access_to_app 'user_grant_access', 'app_1'
      .then ->
        model.get 'user_grant_access'
        .then (user) ->
          assert.deepEqual user.apps.values, [ 'app_1' ]
      .then ->
        model.grant_access_to_app 'user_grant_access', 'app_2'
      .then ->
        model.get 'user_grant_access'
        .then (user) ->
          assert.deepEqual user.apps.values.sort(), [ 'app_1', 'app_2' ]

    it 'fails to add app to non-existent user', (done) ->
      model.grant_access_to_app 'user_does_not_exist', 'app'
      .thenThrow new Error('Expected error')
      .catch -> done()

  describe 'revoke_access_to_app', ->

    it 'removes apps from existing user', ->
      model.add
        id: 'user_revoke_access'
        apps: db.create_set [ 'app_1', 'app_2' ]
      .then ->
        model.revoke_access_to_app 'user_revoke_access', 'app_1'
      .then ->
        model.get 'user_revoke_access'
        .then (user) ->
          assert.deepEqual user.apps.values, [ 'app_2' ]
      .then ->
        model.revoke_access_to_app 'user_revoke_access', 'app_2'
      .then ->
        model.get 'user_revoke_access'
        .then (user) ->
          assert !user.apps

    it 'fails to remove app from non-existent user', (done) ->
      model.revoke_access_to_app 'user_does_not_exist', 'app'
      .thenThrow new Error('Expected error')
      .catch -> done()
