var _ = require('underscore');
var Promise = require('bluebird');
var db = require('../db');
var debug = require('debug')(require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

exports.report_from_statements = function(statements) {
  return statements.reduce(function(report, stmt) {
    while (report.length < stmt.line) {
      report.push(null);
    }
    report[stmt.line] = _.omit(stmt, ['line']);
    return report;
  }, []);
}

exports.key = function(result) {
  return {
    code_id: result.code_id,
    started_at: result.started_at
  };
}

exports.create = function(code_id, started_at, app) {
  debug('create', code_id, started_at, app.identifier);
  return db.v2.results.put({ Item: {
    code_id: code_id,
    started_at: started_at,
    app: app
  }})
  .then(function() {
    return { code_id: code_id, started_at: started_at };
  });
}

exports.get = function(code_id, started_at) {
  debug('get', code_id, started_at);
  return db.v2.results.get({ Key: {
    code_id: code_id,
    started_at: typeof(started_at) === 'string' ? parseInt(started_at) : started_at
  }})
  .then(function(result) {
    if (!result) throw 'Report for ' + code_id + ' started at ' + started_at + ' not found';
    return result;
  });
}

exports.set_report = function(key, report) {
  debug('set_report', key);
  return db.v2.results.update({
    Key: key,
    UpdateExpression: 'SET report = :report',
    ExpressionAttributeValues: { ':report': report },
    ConditionExpression: 'attribute_not_exists(report)'
  });
}

exports.update = function(key, response) {
  debug('update', key, 'with', Object.keys(response));

  if ('line' in response && typeof(response.line) !== 'number') {
    return Promise.reject('"line" must be an integer');
  }

  if ('result' in response) { // Statement successful
    return db.v2.results.update({
      Key: key,
      UpdateExpression: 'SET report[' + response.line + '].success = :result',
      ConditionExpression:
        'attribute_not_exists(success) ' +
        'AND attribute_not_exists(#error) ' +
        'AND attribute_exists(report) ' +
        'AND attribute_not_exists(report[' + response.line + '].success)',
      ExpressionAttributeNames: {
        '#error': 'error'
      },
      ExpressionAttributeValues: {
        ':result': _.omit(response, 'line')
      }
    });
  }
  if ('error' in response) {
    return (('line' in response)
      ? db.v2.results.update({
          Key: key,
          UpdateExpression: 'SET report[' + response.line + '].#error = :error',
          ConditionExpression:
            'attribute_not_exists(success) ' +
            'AND attribute_not_exists(#error) ' +
            'AND attribute_exists(report) ' +
            'AND attribute_not_exists(report[' + response.line + '].success)',
          ExpressionAttributeNames: {
            '#error': 'error'
          },
          ExpressionAttributeValues: {
            ':error': {
              description: response.error,
              stacktrace: response.stacktrace
            }
          }
        })
      : Promise.resolve())
    .then(function() {
      return db.v2.results.update({
        Key: key,
        UpdateExpression: 'SET #error = :error',
        ConditionExpression: 'attribute_not_exists(success) AND attribute_not_exists(#error)',
        ExpressionAttributeNames: {
          '#error': 'error'
        },
        ExpressionAttributeValues: {
          ':error': {
            description: response.error,
            stacktrace: response.stacktrace
          }
        }
      });
    });
  }
  if ('success' in response) {
    if (response.success) {
      // Completed successfully
      return db.v2.results.update({
        Key: key,
        UpdateExpression: 'SET success = :success',
        ConditionExpression: 'attribute_not_exists(success) AND attribute_not_exists(#error)',
        ExpressionAttributeNames: {
          '#error': 'error'
        },
        ExpressionAttributeValues: {
          ':success': response.success
        }
      });
    } else {
      // Not successful. The error has already been logged.
      return Promise.resolve();
    }
  }
  return Promise.reject('Don\'t know what to do with: ' + JSON.stringify(response));
}

exports.latest = function(code_id) {
  debug('get_latest', code_id);
  return db.v2.results.query({
    KeyConditions: {
      code_id: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [code_id]
      }
    },
    ScanIndexForward: false,
    Limit: 1,
    AttributesToGet: [
      'code_id',
      'started_at',
      'success',
      'error'
    ]
  })
  .then(function(results) {
    return results.Items && results.Items[0];
  });
}

exports.all_latest = function(code_ids) {
  // TODO: optimise
  return Promise.all(
    code_ids.map(exports.latest)
  );
}
