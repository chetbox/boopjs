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
        "😢 #{app.name} failed #{count_set app.failed} test(s)"
      else
        "🎉 #{app.name} passed all #{count_set app.successful} test(s)"
    body:
      """
      #{app.name} #{app.version} (#{app.identifier})
      #{if app.failed then "#{count_set app.failed} test(s) failed" else ''}
      #{count_set app.successful} test(s) passed
      #{host.protocol}://#{host.address}/app/#{app_id}
      \n\n
      """ +
      (
        all_code.map (code) ->
          """
          #{status_emoji code.latest_result} #{code.name} #{error_message code.latest_result}
          #{host.protocol}://#{host.address}/app/#{app_id}/test/#{code.id}/report/#{code.latest_result.started_at}
          """
        .join '\n\n'
      ) +
      '\n\n\nHave questions or comments? Just reply to this email.'
