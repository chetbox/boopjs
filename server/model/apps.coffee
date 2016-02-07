shortid = require 'shortid'

db = require('../db').v2.apps
debug = require('debug')('chetbot:' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''))

exports.create_empty = (user_id) ->
  debug 'create_empty', user_id
  new_app_id = shortid.generate()
  item =
    id: new_app_id,
    admins: [user_id],
    platform: 'android'
  db.put
    Item: item
  .then ->
    item

exports.get = (id) ->
  debug 'get', id
  db.get
    Key:
      id: id

exports.mark_as_not_run = (id, code_id) ->
  debug 'mark_as_not_run', id, code_id
  db.update
    Key: { id: id }
    UpdateExpression: 'ADD not_run :code_ids DELETE running :code_ids, successful :code_ids, failed :code_ids'
    ExpressionAttributeValues:
      ':code_ids': db.create_set [ code_id ]

exports.update_result = (result) ->
  debug 'update_result', result.code_id, result.started_at
  new_status = 'running'
  if result.success
    new_status = 'successful'
  else if result.error
    new_status = 'failed'

  other_statuses = [ 'not_run', 'running', 'successful', 'failed' ]
  other_statuses.splice other_statuses.indexOf(new_status), 1

  db.update
    Key: { id: result.app.id }
    UpdateExpression: 'ADD #new_status :code_ids DELETE #other_status_0 :code_ids, #other_status_1 :code_ids, #other_status_2 :code_ids'
    ExpressionAttributeNames:
      '#new_status': new_status
      '#other_status_0': other_statuses[0]
      '#other_status_1': other_statuses[1]
      '#other_status_2': other_statuses[2]
    ExpressionAttributeValues:
      ':code_ids': db.create_set [ result.code_id ]
    ReturnValues: 'ALL_NEW'
  .then (app) ->
    app.Attributes

exports.remove_code = (id, code_id) ->
  debug 'remove_code', id, code_id
  db.update
    Key: { id: id }
    UpdateExpression: 'DELETE not_run :code_id, running :code_id, successful :code_id, failed :code_id'
    ExpressionAttributeValues:
      ':code_id': db.create_set [ code_id ]

exports.set_pending_report = (id, pending) ->
  debug 'set_pending_report', id, pending
  db.update
    Key: { id: id }
    UpdateExpression: 'SET pending_report = :pending'
    ExpressionAttributeValues:
      ':pending': !!pending

exports.get_pending_report = (id) ->
  debug 'get_pending_report', id
  db.get
    Key: { id: id }
    AttributesToGet: [ 'pending_report' ]
  .then (app) ->
    if !app then throw new Error("App #{id} not found")
    !!app.pending_report

exports.set_processing_status = (id, progress) ->
  debug 'set_processing_status', id, progress
  db.update
    Key: { id: id }
    UpdateExpression: 'SET processing_status = :status'
    ExpressionAttributeValues:
      ':status':
        timestamp: Date.now()
        progress: progress
    ConditionExpression: 'attribute_exists(id)'

exports.mark_as_processed = (id) ->
  debug 'mark_as_processed', id
  db.update
    Key: { id: id }
    UpdateExpression: 'REMOVE processing_status'

exports.set_processing_error = (id, err) ->
  debug 'set_processing_error', id, err
  db.update
    Key: { id: id }
    UpdateExpression: 'SET processing_status = :err'
    ExpressionAttributeValues:
      ':err':
        timestamp: Date.now()
        error: err.toString()
    ConditionExpression: 'attribute_exists(id)'
