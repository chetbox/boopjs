_ = require 'underscore'
debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''))

db = require('../db').v2.users

exports.get = (id) ->
  debug 'get', id
  db.get
    Key: { id: id }

exports.add = (user) ->
  debug 'put', user.id, user.username
  db.put
    Item: user

exports.emails_for_users = (user_ids) ->
  debug 'emails_for_users', user_ids
  db.batch_get
    Keys: user_ids.map (id) -> id: id
    AttributesToGet: [ 'emails' ]
  .then (users) ->
    _.flatten \
      users.map (u) -> Object.keys u.emails

exports.set_email_enabled = (id, address, enabled) ->
  if enabled
    return db.update
      Key: { id: id }
      UpdateExpression: 'REMOVE emails.#address.disabled'
      ConditionExpression: 'attribute_exists(emails.#address)'
      ExpressionAttributeNames:
        '#address': address
  else
    return db.update
      Key: { id: id }
      UpdateExpression: 'SET emails.#address.disabled = :disabled'
      ConditionExpression: 'attribute_exists(emails.#address)'
      ExpressionAttributeNames:
        '#address': address
      ExpressionAttributeValues:
        ':disabled': true
