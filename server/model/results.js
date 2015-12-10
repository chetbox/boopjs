var _ = require('underscore');
var db = require('../db');
var debug = require('debug')(require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

exports.report_from_statements= function(statements) {
  return statements.reduce(function(report, stmt) {
    while (report.length < stmt.line) {
      report.push(null);
    }
    report[stmt.line] = _.omit(stmt, ['line']);
    return report;
  }, []);
}

exports.create = function(code_id, started_at, app) {
  debug('create', code_id, started_at, app.identifier);
  return db.v2.results.put({
    Item: {
      code_id: code_id,
      started_at: started_at,
      app: app
    }
  })
  .then(function() {
    return { code_id: code_id, started_at: started_at };
  })
}

exports.check_exists = function(code_id, started_at) {
  debug('check_exists', code_id, started_at);
  return db.v2.results.get({
    code_id: code_id,
    started_at: started_at
  })
  .then(function(result) {
    if (!result) throw 'Report for ' + code_id + ' started at ' + req.query.started_at + ' not found';
    return { code_id: result.code_id, started_at: result.started_at };
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
  if ('result' in response) { // Statement successful
    if (typeof(response.line) !== 'number')
      return Promise.reject('"line" must be an integer');
    return db.v2.results.update({
      Key: key,
      UpdateExpression: 'SET report[' + response.line + '].success = :result',
      ExpressionAttributeValues: {
        ':result': _.omit(response, 'line')
      },
      ConditionExpression: 'attribute_exists(report)'
    });
  }
  if ('error' in response && 'line' in response) { // Execution error
    return db.v2.results.update({
      Key: key,
      UpdateExpression: 'SET report[:line].error = :result',
      ExpressionAttributeValues: {
        ':line': response.line,
        ':result': _.omit(response, 'line')
      }
    });
  }
  if ('error' in response) { // Uncaught exception
    return db.v2.results.update({
      Key: key,
      AttributeUpdates: {
        success: { Action: 'PUT', Value: false },
        error: { Action: 'PUT', Value: {
          description: response.error,
          stacktrace: response.stracktrace
        }}
      }
    });
  }
  if ('success' in response) { // Completed successfully
    return db.v2.results.update({
      Key: key,
      AttributeUpdates: {
        success: { Action: 'PUT', Value: response.success },
      }
    });
  }
  return Promise.reject('Don\'t know what to do with: ' + JSON.stringify(response));
}
