net = require('net')
spawn = require('child_process').spawn
Promise = require('bluebird')
db = require('../../db')
results = require('../../model/results')
DYNAMODB_LOCAL = process.env.DYNAMODB_LOCAL or 'dynamodb-local'

port_available = (port, fn) ->
  tester = net.createServer()
  .once 'error', (err) ->
    if err.code != 'EADDRINUSE'
      return fn(err)
    fn null, true
  .once 'listening', ->
    tester.once 'close', ->
      fn null, false
    .close()
  .listen port

exports.setup_mocha = ->
  db_process = undefined

  before 'start in-memory dynamodb-local & create tables', (done) ->
    @timeout 12000
    if process.env.NODE_ENV != 'test'
      throw new Error("Wrong NODE_ENV (#{process.env.NODE_ENV}) You should be running with NODE_ENV=test")
    dynamo_db_local = DYNAMODB_LOCAL.split(' ')[0]
    dynamo_db_local_args = DYNAMODB_LOCAL.split(' ').slice(1)
    db_process = spawn \
      dynamo_db_local,
      dynamo_db_local_args.concat([ '-inMemory', '-port', '8765' ]),
      detached: true
    check_started = setInterval (->
      port_available 8765, (err) ->
        if !err
          clearInterval check_started
          db.setup()
          .then -> done()
    ), 100

  after 'stop dynamodb-local', ->
    # See http://azimi.me/2014/12/31/kill-child_process-node-js.html
    process.kill -db_process.pid
    db_process = undefined

  afterEach 'delete all items', ->
    @timeout 10000
    Promise.join \
      db.v2.results.scan(AttributesToGet: [ 'code_id', 'started_at' ]),
      db.v2.code.scan(AttributesToGet: [ 'app_id', 'id' ]),
      db.v2.apps.scan(AttributesToGet: [ 'id' ])
    .spread (results, code, apps) -> [
      db.v2.results.batch_delete(results.Items)
      db.v2.code.batch_delete(code.Items)
      db.v2.apps.batch_delete(apps.Items)
    ]
