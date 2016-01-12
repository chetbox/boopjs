assert = require('assert')
db = require('../../db').v2

APP =
  id: 'app7890'
  name: 'Antelope'

assert_results = (expected) ->
  db.results.scan {}
  .then (results) ->
    assert.deepEqual expected, results.Items

assert_code = (expected) ->
  db.code.scan {}
  .then (code) ->
    assert.deepEqual expected, code.Items

assert_report = (key, expected) ->
  db.results.get(Key: key)
  .then (result) ->
    assert.deepEqual expected, result.report

describe 'model/results', ->
  require('./in_memory_db').setup_mocha()
  results = require('../../model/results')

  describe 'report_from_statements', ->

    rfs = results.report_from_statements

    it 'converts no statements to an empty list', ->
      assert.deepEqual results.report_from_statements([]), []

    it 'converts one statement to a list of undefined and the item', ->
      assert.deepEqual \
        rfs([{ line: 1, source: 'one();' }]),
        [
          null
          { source: 'one();' }
        ]

    it 'converts two adjacent statements', ->
      assert.deepEqual \
        rfs([
          { line: 1, source: 'one();' }
          { line: 2, source: 'two();' }
        ]),
        [
          null
          { source: 'one();' }
          { source: 'two();' }
        ]

    it 'converts non-adjacent statements', ->
      assert.deepEqual \
        rfs([
          { line: 1, source: 'one();' }
          { line: 4, source: 'four();' }
        ]),
        [
          null
          { source: 'one();' }
          null
          null
          { source: 'four();' }
        ]

    it 'preserves all keys', ->
      assert.deepEqual \
        rfs([{line: 1, a: 'aa', b: 'bb', c: 'cc', }]),
        [
          null,
          {a: 'aa', b: 'bb', c: 'cc'}
        ]

  describe 'create, get', ->

    it '"create" then "get"', ->
      results.create('code_one', 456789, APP)
      .then (result) ->
        assert.deepEqual results.key(result),
          code_id: 'code_one'
          started_at: 456789
      .then ->
        assert_results [{
          code_id: 'code_one'
          started_at: 456789
          app: APP
        }]
      .then ->
        results.get 'code_one', 456789
      .then (result) ->
        assert.deepEqual result,
          code_id: 'code_one'
          started_at: 456789
          app: APP

  describe 'updating results', ->

    it 'successful empty test', ->
      key = undefined
      results.create('code_empty_test', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [ null ]
      .then ->
        results.update key, success: true
      .then ->
        [
          assert_results [{
            code_id: 'code_empty_test'
            started_at: 123456
            app: APP
            report: [ null ]
            success: true
          }]
          assert_code [{
            id: 'code_empty_test'
            app_id: APP.id
            latest_result:
              started_at: 123456
              success: true
          }]
        ]

    it 'unhandled exception', ->
      key = undefined
      results.create('code_unhandled_exception', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [ null ]
      .then ->
        results.update key,
          device: null
          error: 'forced crash'
          stacktrace: 'java.lang.RuntimeException'
          type: 'unhandled'
      .then -> [
        assert_results [{
          code_id: 'code_unhandled_exception'
          started_at: 123456
          app: APP
          report: [ null ]
          error:
            description: 'forced crash'
            stacktrace: 'java.lang.RuntimeException'
        }]
        assert_code [{
          app_id: APP.id
          id: 'code_unhandled_exception'
          latest_result:
            started_at: 123456
            error:
              description: 'forced crash'
              stacktrace: 'java.lang.RuntimeException'
        }]
      ]

    it 'successful test run', ->
      key = undefined
      results.create('code_successful', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [
          null
          { source: 'one()' }
          null
          { source: 'three()' }
        ]
      .then -> [
        results.update key,
          line: 1
          result: 'First.'
        results.update key,
          line: 3
          result: [ 'Th', 'ir', 'd' ]
      ]
      .spread ->
        results.update key, success: true
      .then ->
        assert_results [{
          code_id: 'code_successful'
          started_at: 123456
          app: APP
          report: [
            null
            {
              source: 'one()'
              success: result: 'First.'
            }
            null
            {
              source: 'three()'
              success: result: ['Th', 'ir', 'd']
            }
          ]
          success: true
        }]

    it 'stores log messages', ->
      key = undefined
      results.create('code_logging', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [
          null
          null
          { source: 'a_fn_which_logs()' }
        ]
      .then ->
        results.update key,
          line: 2
          level: 'debug'
          log: [
            'First'
            'messsage'
          ]
      .then ->
        results.update key,
          line: 2
          level: 'warn'
          log: [
            'Second message'
            { empty: '' }
          ]
      .then ->
        results.update key,
          line: 2
          result: null
      .then ->
        assert_report key, [
          null
          null
          {
            source: 'a_fn_which_logs()'
            success: result: null
            logs: [
              {
                level: 'debug'
                message: ['First', 'messsage']
              }
              {
                level: 'warn'
                message: ['Second message', { empty: null }]
              }
            ]
          }
        ]

    it 'error executing line', ->
      key = undefined
      results.create('code_line_error', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [
          null
          { source: 'one()' }
          { source: 'two()' }
          { source: 'three()' }
        ]
      .then -> [
        results.update(key,
          line: 1
          result: 'First.')
        results.update(key,
          line: 2
          error: 'Error on line 2'
          stacktrace: 'Line 2\nError')
      ]
      .spread ->
        results.update key, success: false
      .then -> [
        assert_results [{
          code_id: 'code_line_error'
          started_at: 123456
          app: APP
          report: [
            null
            { source: 'one()', success: result: 'First.' }
            { source: 'two()', error: { description: 'Error on line 2', stacktrace: 'Line 2\nError' } }
            { source: 'three()' }
          ]
          error:
            description: 'Error on line 2'
            stacktrace: 'Line 2\nError'
            line: 2
            source: 'two()'
        }]
        assert_code [{
          id: 'code_line_error'
          app_id: APP.id
          latest_result:
            started_at: 123456
            error:
              description: 'Error on line 2'
              stacktrace: 'Line 2\nError'
              line: 2
              source: 'two()'
        }]
      ]

    it 'update received after a test has succeeded', ->
      key = undefined
      results.create('code_update_successful', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [
          null
          { source: 'one()' }
        ]
      .then ->
        results.update key, success: true
      .then ->
        results.update key,
          line: 1
          result: null
          type: 'NULL'
      .then ->
        assert_results [{
          code_id: 'code_update_successful'
          started_at: 123456
          app: APP
          report: [
            null
            {
              source: 'one()'
              success:
                result: null
                type: 'NULL'
            }
          ]
          success: true
        }]

    it 'update received after a test has already failed', ->
      key = undefined
      results.create('code_update_failed', 123456, APP)
      .then (result) ->
        key = results.key result
        results.set_report key, [
          null
          { source: 'one()' }
        ]
      .then ->
        results.update key,
          error: 'Things went down'
          stacktrace: 'Bad things'
      .then ->
        results.update key,
          line: 1
          result: null
          type: 'NULL'
      .then ->
        assert_results [{
          code_id: 'code_update_failed'
          started_at: 123456
          app: APP
          report: [
            null
            {
              source: 'one()'
              success:
                result: null
                type: 'NULL'
            }
          ]
          error:
            description: 'Things went down'
            stacktrace: 'Bad things'
        }]

    describe 'failure cases', ->

      it 'finishing an already successful test', (done) ->
        key = undefined
        results.create('code_finish_twice_success', 123456, APP)
        .then (result) ->
          key = results.key result
          results.set_report key, [ null ]
        .then ->
          results.update key, success: true
        .then ->
          results.update key, success: true
        .then ->
          done 'Expecting an update error'
        .catch (e) ->
          assert e instanceof Error
        .then ->
          results.update key,
            error: 'Uh oh'
            stacktrace: 'Bad things happened'
        .then ->
          done 'Expecting an update error'
        .catch (e) ->
          assert e instanceof Error
        .then done

      it 'finishing an already failed test', (done) ->
        key = undefined
        results.create('code_finish_twice_error', 123456, APP)
        .then (result) ->
          key = results.key result
          results.set_report key, [ null ]
        .then ->
          results.update key,
            error: 'Things went wrong'
            stacktrace: 'This wasn\'t planned'
        .then ->
          results.update key, success: true
        .then ->
          done 'Expecting an update error'
        .catch (e) ->
          assert e instanceof Error
        .then ->
          results.update key,
            error: 'Uh oh'
            stacktrace: 'Bad things happened'
        .then ->
          done 'Expecting an update error'
        .catch (e) ->
          assert e instanceof Error
        .then done

      it 'the same line is successful twice', (done) ->
        key = undefined
        results.create('code_update_line_twice_success', 123456, APP)
        .then (result) ->
          key = results.key result
          results.set_report key, [
            null
            { source: 'one()' }
          ]
        .then ->
          results.update key,
            line: 1
            result: 'first'
        .then ->
          results.update key,
            line: 1
            result: 'second'
        .then ->
          done 'Expecting an update error'
        .catch (e) ->
          assert e instanceof Error
        .then ->
          assert_results [{
            code_id: 'code_update_line_twice_success'
            started_at: 123456
            app: APP
            report: [
              null
              {
                source: 'one()'
                success: result: 'first'
              }
            ]
          }]
        .then done

      it 'updating the same line twice', (done) ->
        key = undefined
        results.create('code_update_line_twice', 123456, APP)
        .then (result) ->
          key = results.key result
          results.set_report key, [
            null
            { source: 'one()' }
          ]
        .then ->
          results.update key,
            line: 1
            error: 'first'
            stacktrace: '1111'
        .then ->
          results.update key,
            line: 1
            error: 'second'
            stacktrace: '2222'
        .then ->
          done 'Expecting an update error'
        .catch (e) ->
          assert e instanceof Error
        .then ->
          assert_results [{
            code_id: 'code_update_line_twice'
            started_at: 123456
            app: APP
            report: [
              null
              { source: 'one()', error: { description: 'first', stacktrace: '1111' } }
            ]
            error:
              description: 'first'
              stacktrace: '1111'
              line: 1
              source: 'one()'
          }]
        .then done

  describe 'automated build test runner status', ->

    it 'open and finish', (done) ->
      access_token = undefined
      results.create_automated('code_automated_opened', 123456, APP)
      .then (result) ->
        assert result.access_token
        assert.equal result.test_runner_status, 'queued'
        access_token = result.access_token
      .then ->
        results.set_test_runner_status 'queued', 'opened', 'code_automated_opened', '123456', access_token
      .then ->
        results.set_test_runner_status 'opened', 'finished', 'code_automated_opened', '123456', access_token
      .then ->
        results.get 'code_automated_opened', 123456
      .then (result) ->
        assert.equal result.test_runner_status, 'finished'
      .then done

    it 'open fails with invalid access_token', (done) ->
      results.create_automated('code_invalid_token', 123456, APP)
      .then ->
        results.set_test_runner_status 'queued', 'opened', 'code_invalid_token', '123456', '**invalid**token**'
      .then ->
        done 'Expected an access token error'
      .catch (e) ->
        done()

    it 'fails to update', (done) ->
      results.create_automated('code_automated_update_error', 123456, APP)
      .then (result) ->
        results.set_test_runner_status 'finished', 'opened', 'code_automated_update_error', '123456', result.access_token
      .then ->
        done 'Expected an access token error'
      .catch (e) ->
        done()