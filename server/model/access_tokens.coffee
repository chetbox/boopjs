shortid = require 'shortid'
debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''))

db = require('../db').v2.access_tokens

exports.create = (user_id) ->
  debug 'create', user_id
  item =
    token: shortid.generate()
    user_id: user_id
  db.put
    Item: item
  .then ->
    item

exports.get = (token) ->
  debug 'get', token
  db.get
    Key:
      token: token

exports.get_all_for_user = (user_id) ->
  debug 'get_all_for_user', user_id
  db.query
    IndexName: 'user_id_index'
    KeyConditionExpression: 'user_id = :user_id'
    ExpressionAttributeValues:
      ':user_id': user_id
  .then (user_tokens) ->
    user_tokens.Items

exports.get_or_create_for_user = (user_id) ->
  debug 'get_or_create_for_user', user_id
  exports.get_all_for_user user_id
  .then (tokens) ->
    if (tokens && tokens.length)
      tokens
    else
      exports.create user_id
      .then (new_token) ->
        [ new_token ]
