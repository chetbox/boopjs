os = require 'os'
path = require 'path'
fs = require 'fs'
shortid = require 'shortid'

exports.save_file = (data) ->
  save_to_path = path.join os.tmpdir(), shortid.generate()
  fs.writeFileSync save_to_path, data
  save_to_path
