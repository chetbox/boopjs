var _ = require('underscore');
var Promise = require('bluebird');
var db = require('../db');
var debug = require('debug')('chetbot/' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));
var shortid = require('shortid');

Promise.longStackTraces();

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

function create(code_id, started_at, app, extra_attrs) {
  var item = _.extend(
    {
      code_id: code_id,
      started_at: started_at,
      app: app
    },
    extra_attrs
  );
  return db.v2.results.put({Item: item})
  .then(function() {
    return item;
  });
}

exports.create = function(code_id, started_at, app) {
  debug('create', code_id, started_at, app.identifier);
  return create(code_id, started_at, app, {});
}

exports.create_automated = function(code_id, started_at, app) {
  debug('create_automated', code_id, started_at, app.identifier);
  return create(code_id, started_at, app, {
    test_runner_status: 'queued',
    access_token: shortid.generate()
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
        'attribute_exists(report) ' +
        'AND attribute_not_exists(report[' + response.line + '].success) ' +
        'AND attribute_not_exists(report[' + response.line + '].#error)',
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
            'attribute_not_exists(#error) ' +
            'AND attribute_exists(report) ' +
            'AND attribute_not_exists(report[' + response.line + '].success) ' +
            'AND attribute_not_exists(report[' + response.line + '].#error)',
          ExpressionAttributeNames: {
            '#error': 'error'
          },
          ExpressionAttributeValues: {
            ':error': {
              description: response.error,
              stacktrace: response.stacktrace
            }
          },
          ReturnValues: 'ALL_OLD'
        })
      : Promise.resolve())
    .then(function(line_updated) {
      return db.v2.results.update({
        Key: key,
        UpdateExpression: 'SET #error = :error',
        ConditionExpression: 'attribute_not_exists(success) AND attribute_not_exists(#error)',
        ExpressionAttributeNames: {
          '#error': 'error'
        },
        ExpressionAttributeValues: {
          ':error': _.extend(
            {description: response.error, stacktrace: response.stacktrace},
            line_updated
              ? {line: response.line, source: line_updated.Attributes.report[response.line].source}
              : {}
          )
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
  if ('log' in response) {
    if (typeof(response.line) !== 'number') {
      return Promise.reject('"line" must be an integer');
    }
    return db.v2.results.update({
      Key: key,
      UpdateExpression: 'SET report[' + response.line + '].#logs = list_append(if_not_exists(report[' + response.line + '].#logs, :empty_list), :new_logs)',
      ConditionExpression: 'attribute_exists(report[' + response.line + '].#source)',
      ExpressionAttributeNames: {
        '#source': 'source',
        '#logs': 'logs'
      },
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':new_logs': [{level: response.level, message: response.log}]
      }
    });
  }
  return Promise.reject('Don\'t know what to do with: ' + JSON.stringify(response));
}

exports.update_with_callback = function(code, started_at, result) {
  debug('update_with_callback', code, started_at);
  return result.success
    ? Promise.resolve() // Nothing to do for a successful test run
    : exports.update(
        {code_id: code, started_at: started_at},
        {error: result.error.message, stacktrace: result.error.info}
      );
}

exports.set_test_runner_status = function(expected_status, new_status, code_id, started_at, access_token) {
  debug('set_test_runner_status', code_id, started_at, new_status, access_token);
  return db.v2.results.update({
    Key: {code_id: code_id, started_at: (typeof(started_at) === 'string') ? parseInt(started_at) : started_at},
    UpdateExpression: 'SET test_runner_status = :new_status',
    ConditionExpression: 'access_token = :access_token AND test_runner_status = :expected_status',
    ExpressionAttributeValues: {
      ':expected_status': expected_status,
      ':new_status': new_status,
      ':access_token': access_token
    }
  });
}

function get_in(obj, selector) {
  return selector.split('.').reduce(
    function(obj, key) {
      return obj[key];
    },
    obj
  );
};

exports.middleware = {
  set_test_runner_status: function(expected_status, new_status, code_id_key, started_at_key, access_token_key) {
    return function(req, res, next) {
      exports.set_test_runner_status(
        expected_status,
        new_status,
        get_in(req, code_id_key),
        get_in(req, started_at_key),
        get_in(req, access_token_key)
      )
      .then(function() { next(); })
      .catch(next);
    };
  }
};

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

exports.all = function(code_id) {
  // TODO: paging
  debug('all', code_id);
  return db.v2.results.query({
    KeyConditions: {
      code_id: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [code_id]
      }
    },
    ScanIndexForward: false,
    Limit: 50
  })
  .then(function(results) {
    return results.Items && results.Items;
  });
}

exports.all_latest = function(code_ids) {
  // TODO: optimise
  return Promise.all(
    code_ids.map(exports.latest)
  );
}
