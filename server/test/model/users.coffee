assert = require 'assert'
Promise = require 'bluebird'

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
