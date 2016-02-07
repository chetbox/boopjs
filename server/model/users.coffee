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
    _.flatten(
      users \
      .map (user) ->
        _.map user.emails, (meta, address) ->
          if meta.disabled then false else address
        .filter (email) -> email
    )

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

exports.grant_access_to_app = (id, app_ids...) ->
  return db.update
    Key: { id: id }
    UpdateExpression: 'ADD apps :new_apps'
    ExpressionAttributeValues:
      ':new_apps': db.create_set app_ids
    ConditionExpression: 'attribute_exists(id)'

exports.revoke_access_to_app = (id, app_ids...) ->
  return db.update
    Key: { id: id }
    UpdateExpression: 'DELETE apps :apps_to_remove'
    ExpressionAttributeValues:
      ':apps_to_remove': db.create_set app_ids
