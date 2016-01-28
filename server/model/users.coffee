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
      .map (u) -> u.emails
      .map (emails) -> if Array.isArray(emails) then emails else emails.values # Handle DynamoDB sets
      .filter (emails) -> emails
    )
    .map (email) -> if typeof(email) == 'string' then email else email.email # TODO: never a string with new data model
