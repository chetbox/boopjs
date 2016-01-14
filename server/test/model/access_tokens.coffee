assert = require 'assert'
Promise = require 'bluebird'

# SUT
model = require('../../model/access_tokens')

assert_token = (expected) ->


describe 'model/access_tokens', ->
  require('./in_memory_db').setup_mocha()

  describe 'create/get', ->

    it 'creates, get', ->
      second_token = undefined
      Promise.all [
        model.create 'user_id_create'
        model.create 'user_id_create'
        model.create 'user_id_create'
      ]
      .spread (first, second, third) ->
        second_token = second.token
        model.get second.token
      .then (second) ->
        assert.deepEqual
          token: second_token
          user_id: 'user_id_create'
        , second

    it 'get all tokens for a user', ->
      Promise.all [
        model.create 'user_id_all_a'
        model.create 'user_id_all_b'
        model.create 'user_id_all_a'
      ]
      .then ->
        model.get_all_for_user ('user_id_all_a')
      .then (tokens_a) ->
        assert.equal tokens_a.length, 2
        assert.notEqual tokens_a[0].token, tokens_a[1].token

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
          assert.notEqual tokens_a[0].token, tokens_a[1].token

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
          assert tokens_c[0].token
