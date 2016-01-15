debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.(js|coffee)$/, ''))

db = require('../db').v2.users

exports.get = (id) ->
  debug 'get', id
  db.get
    Key: { id: id }
