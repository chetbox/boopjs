assert = require 'assert'
Promise = require 'bluebird'

# SUT
model = require('../../model/access_tokens')

describe 'model/access_tokens', ->
  require('./in_memory_db').setup_mocha()

  describe 'create/get', ->

    it 'creates & gets user from token', ->
      Promise.all [
        model.create 'user_id_create_a'
        model.create 'user_id_create_b'
        model.create 'user_id_create_c'
      ]
      .spread (first, second, third) ->
        model.get_user_id second
      .then (second) ->
        assert.equal second, 'user_id_create_b'

    it 'returns falsey if token not found', ->
      model.create 'user_id_not_found'
      .then ->
        model.get_user_id 'this_is_an_invalid_token'
      .then (u) ->
        assert !u

    it 'gets all tokens for a user', ->
      Promise.all [
        model.create 'user_id_all_a'
        model.create 'user_id_all_b'
        model.create 'user_id_all_a'
      ]
      .then ->
        model.get_all_for_user ('user_id_all_a')
      .then (tokens_a) ->
        assert.equal tokens_a.length, 2
        assert.notEqual tokens_a[0], tokens_a[1]

    describe 'get or create', ->
      it 'gets existing', ->
        Promise.all [
          model.create 'user_id_all_a'
          model.create 'user_id_all_b'
          model.create 'user_id_all_a'
        ]
        .then ->
          model.get_or_create_for_user ('user_id_all_a')
        .then (tokens_a) ->
          assert.equal tokens_a.length, 2
          assert.notEqual tokens_a[0], tokens_a[1]

      it 'creates a new token if one doesn\'t exist', ->
        Promise.all [
          model.create 'user_id_all_a'
          model.create 'user_id_all_b'
          model.create 'user_id_all_a'
        ]
        .then ->
          model.get_or_create_for_user ('user_id_all_c')
        .then (tokens_c) ->
          assert.equal tokens_c.length, 1
          assert tokens_c[0]
