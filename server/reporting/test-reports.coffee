Promise = require 'bluebird'
host = require('config').host

model =
  apps: require '../model/apps'
  code: require '../model/code'

count_set = (set) ->
  if set
    set.values.length
  else
    0

status_emoji = (result) ->
  if result.success
    '✅'
  else if result.error
    '❌'
  else
    '❓'

error_message = (result) ->
  if result.error
    "\n! #{result.error.description}"
  else
    ''

exports.app_results = (app_id) ->
  Promise.join \
    model.apps.get(app_id),
    model.code.get_all(app_id)
  .spread (app, all_code) ->
    failed = app.failed
    subject:
      if app.failed
        "❌ #{app.name} failed #{count_set app.failed} test"
      else
        "✅ #{app.name} passed all #{count_set app.successful} tests"
    body:
      """
      #{app.name} #{app.version} (#{app.identifier})
      #{if app.failed then "❌ #{count_set app.failed} tests failed" else ''}
      ✅ #{count_set app.successful} tests passed
      #{host.protocol}://#{host.address}/app/#{app_id}


      """ + \
      all_code.map (code) ->
        """
        #{status_emoji code.latest_result} #{code.name} #{error_message code.latest_result}
        #{host.protocol}://#{host.address}/app/#{app_id}/test/#{code.id}/report/#{code.latest_result.started_at}
        """
      .join '\n\n'
