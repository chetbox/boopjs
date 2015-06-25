function run(editor) {
    var script = esprima.parse(
        editor.getSession().getDocument().getValue(),
        {loc: true}
    );

    script.body
        .reduce(function(previous_promise, command) {
            return previous_promise.then(function() {
                return Q(eval(escodegen.generate(command)))
                    .then(function(result) {
                        // do something with the result here
                    });
            });
        }, Q(null))
        .fail(function(e) {
            console.error(e);
        });
}
