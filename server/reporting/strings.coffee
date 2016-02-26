_ = require 'underscore'

exports.user =

  email_addresses: (user) ->
    _.map user.emails, (meta, address) ->
      if meta.disabled then false else address
    .filter (address) -> address
    .join ', '

  name: (user) -> user.displayName || user.username
