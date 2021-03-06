shortid = require 'shortid'

db = require('../db').v2.apps
debug = require('debug')('chetbot:' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''))

exports.create_empty = (user_id) ->
  debug 'create_empty', user_id
  new_app_id = shortid.generate()
  item =
    id: new_app_id,
    admins: db.create_set([user_id]),
    platform: 'android'
    os_version: '5.1'
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
    ConditionExpression: 'attribute_exists(id)'

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
    ConditionExpression: 'attribute_exists(id)'
  .then (app) ->
    app.Attributes

exports.remove_code = (id, code_id) ->
  debug 'remove_code', id, code_id
  db.update
    Key: { id: id }
    UpdateExpression: 'DELETE not_run :code_id, running :code_id, successful :code_id, failed :code_id'
    ExpressionAttributeValues:
      ':code_id': db.create_set [ code_id ]
    ConditionExpression: 'attribute_exists(id)'

exports.set_pending_report = (id, pending) ->
  debug 'set_pending_report', id, pending
  db.update
    Key: { id: id }
    UpdateExpression: 'SET pending_report = :pending'
    ExpressionAttributeValues:
      ':pending': !!pending
    ConditionExpression: 'attribute_exists(id)'

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
    ConditionExpression: 'attribute_exists(id)'

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

exports.set_os_version = (id, version) ->
  debug 'set_os_version', id, version
  if typeof(version) != 'string'
    throw new Error('version must be a string', "got #{typeof(version)}")
  db.update
    Key: { id: id }
    UpdateExpression: 'SET os_version = :version'
    ExpressionAttributeValues:
      ':version': version
    ConditionExpression: 'attribute_exists(id)'

exports.grant_access = (id, user_ids...) ->
  debug 'grant_access', id, user_ids
  db.update
    Key: { id: id }
    UpdateExpression: 'ADD admins :new_user_ids'
    ExpressionAttributeValues:
      ':new_user_ids': db.create_set(user_ids)
    ConditionExpression: 'attribute_exists(id)'

exports.save_init_script = (id, script) ->
  debug 'save_init_script', id, !!script
  if script
    if typeof(script) != 'string'
      throw new Error('script must be a string', "got #{typeof(version)}")
    db.update
      Key: { id: id }
      UpdateExpression: 'SET init_script = :script'
      ExpressionAttributeValues:
        ':script': script
      ConditionExpression: 'attribute_exists(id)'
  else
    db.update
      Key: { id: id }
      UpdateExpression: 'REMOVE init_script'
      ConditionExpression: 'attribute_exists(id)'
