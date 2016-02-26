assert = require 'assert'
Promise = require 'bluebird'

# SUT
strings = require('../../reporting/strings')

describe 'reporting/strings', ->

  describe 'user', ->

    describe 'name', ->

      it 'gets display name', ->
        name = strings.user.name
          displayName: 'Fred Bloggs'
          username: 'fbloggs'
        assert.equal name, 'Fred Bloggs'

      it 'gets username if no display name available', ->
        name = strings.user.name
          username: 'fbloggs'
        assert.equal name, 'fbloggs'

    describe 'emails', ->

      it 'is an empty string if no data', ->
        assert.equal strings.user.email_addresses({}), ''

      it 'is an empty string if no emails', ->
        emails = strings.user.email_addresses
          emails: {}
        assert.equal emails, ''

      it 'returns email addresses from object', ->
        emails = strings.user.email_addresses
          emails:
            'one@example.com':
              verifed: true
              primary: true
            'two@example.com':
              verified: true
        assert.equal emails, 'one@example.com, two@example.com'

      it 'ignores disabled email addresses', ->
        emails = strings.user.email_addresses
          emails:
            'one@example.com':
              verifed: true
              primary: true
            'two@example.com':
              verified: true
              disabled: true
        assert.equal emails, 'one@example.com'
