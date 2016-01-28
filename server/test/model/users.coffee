assert = require 'assert'
Promise = require 'bluebird'

# SUT
model = require '../../model/users'

describe 'model/users', ->
  require('./in_memory_db').setup_mocha()

  describe 'emails_for_users', ->

    it 'gets emails for some users from set (old way)', ->
      Promise.join(
        model.add { id: 'user_email_old_1', emails: { type: 'String', values: [ 'one@example.com' ] } } # AWS-SDK
        model.add { id: 'user_email_old_2', emails: [ 'two@example.com', 'too@example.com' ] } # Dynasty
        model.add { id: 'user_email_old_3', emails: {} }
        model.add { id: 'user_email_old_4' }
      )
      .then ->
        model.emails_for_users [ 'user_email_old_1', 'user_email_old_2', 'user_email_old_3' ]
      .then (emails) ->
        assert.deepEqual emails.sort(),
          [ 'one@example.com', 'too@example.com', 'two@example.com' ]

    it 'gets emails for some users', ->
      Promise.join(
        model.add { id: 'user_email_1', emails: [
          { email: 'one@example.com' }
        ] }
        model.add { id: 'user_email_2', emails: [
          { email: 'two@example.com', verified: true }
          { email: 'too@example.com', verified: true }
        ] }
        model.add { id: 'user_email_3', emails: {} }
        model.add { id: 'user_email_4' }
      )
      .then ->
        model.emails_for_users [ 'user_email_1', 'user_email_2', 'user_email_3' ]
      .then (emails) ->
        assert.deepEqual emails.sort(),
          [ 'one@example.com', 'too@example.com', 'two@example.com' ]
