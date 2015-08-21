exports.fail_on_error = function(res) {
  return function(e) {
    console.error(e.stack || e);
    res.status(500).send(e.toString());
  }
};
