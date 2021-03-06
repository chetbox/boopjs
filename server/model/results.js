var _ = require('underscore');
var Promise = require('bluebird');
var shortid = require('shortid');

var db = require('../db').v2.results;
var code = require('./code');

var debug = require('debug')('chetbot:' + require('path').relative(process.cwd(), __filename).replace(/\.js$/, ''));

exports.report_from_statements = function(statements) {
  return statements.reduce(function(report, stmt) {
    while (report.length < stmt.line) {
      report.push(null);
    }
    report[stmt.line] = _.omit(stmt, ['line']);
    return report;
  }, []);
}

exports.report_from_scripts = function(scripts) {
  return scripts.map(function(script) {
    return _.extend(
      _.pick(script, ['id', 'name']),
      { report: exports.report_from_statements(script.statements) }
    );
  });
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
  return db.put({Item: item})
  .then(function() {
    return code.set_latest_result(item);
  })
  .then(function() {
    return item;
  });
}

exports.create = function(code_id, started_at, app) {
  debug('create', code_id, started_at, app.identifier);
  var result;
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
  return db.get({ Key: {
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
  return db.update({
    Key: key,
    UpdateExpression: 'SET report = :report',
    ExpressionAttributeValues: { ':report': report },
    ConditionExpression: 'attribute_not_exists(report)'
  });
}

/* Recursively replace all 'from' values in a nested structure with 'to' */
function replace_values_in(obj, from, to) {
  if (obj === from) { return to; }
  var recur = function(val, key) {
    return replace_values_in(val, from, to);
  };
  if (Array.isArray(obj)) {
    return _.map(obj, recur);
  } else if (typeof(obj) === 'object') {
    return _.mapObject(obj, recur);
  } else {
    return obj;
  }
};

exports.update = function(key, response) {
  debug('update', key, 'with', Object.keys(response));

  var report_location = null;
  if ('location' in response) {
    if (typeof(response.location.line) !== 'number')
      return Promise.reject(new Error('"location.line" must be an integer'));
    if (typeof(response.location.script) !== 'number')
      return Promise.reject(new Error('"location.script" must be an integer'));

    report_location = 'report[' + response.location.script + '].report[' + response.location.line + ']';
  }

  if ('result' in response) { // Statement successful
    return db.update({
      Key: key,
      UpdateExpression: 'SET ' + report_location + '.success = :result',
      ConditionExpression:
        'attribute_exists(report) ' +
        'AND attribute_not_exists(' + report_location + '.success) ' +
        'AND attribute_not_exists(' + report_location + '.#error)',
        ExpressionAttributeNames: {
          '#error': 'error'
        },
      ExpressionAttributeValues: {
        ':result': _.omit(response, 'location')
      }
    });
  }
  if ('error' in response) {
    return (('location' in response)
      ? db.update({
          Key: key,
          UpdateExpression: 'SET ' + report_location + '.#error = :error',
          ConditionExpression:
            'attribute_not_exists(#error) ' +
            'AND attribute_exists(report) ' +
            'AND attribute_not_exists(' + report_location + '.success) ' +
            'AND attribute_not_exists(' + report_location + '.#error)',
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
      return db.update({
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
              ? {location: response.location, source: line_updated.Attributes.report[response.location.script].report[response.location.line].source}
              : {}
          )
        },
        ReturnValues: 'ALL_NEW'
      });
    })
    .then(function(r) {
      return code.set_latest_result(r.Attributes);
    });
  }
  if ('success' in response) {
    if (response.success) {
      // Completed successfully
      return db.update({
        Key: key,
        UpdateExpression: 'SET success = :success',
        ConditionExpression: 'attribute_not_exists(success) AND attribute_not_exists(#error)',
        ExpressionAttributeNames: {
          '#error': 'error'
        },
        ExpressionAttributeValues: {
          ':success': response.success
        },
        ReturnValues: 'ALL_NEW'
      })
      .then(function(r) {
        return code.set_latest_result(r.Attributes);
      });
    } else {
      // Not successful. The error has already been logged.
      return Promise.resolve();
    }
  }
  if ('log' in response) {
    return db.update({
      Key: key,
      UpdateExpression: 'SET ' + report_location + '.#logs = list_append(if_not_exists(' + report_location + '.#logs, :empty_list), :new_logs)',
      ConditionExpression: 'attribute_exists(' + report_location + '.#source)',
      ExpressionAttributeNames: {
        '#source': 'source',
        '#logs': 'logs'
      },
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':new_logs': [{level: response.level, message: replace_values_in(response.log, '', null)}]
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
  return db.update({
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

exports.all = function(code_id) {
  // TODO: paging
  debug('all', code_id);
  return db.query({
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
