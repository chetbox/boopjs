function run(editor) {
    var script = esprima.parse(
        editor.getSession().getDocument().getValue(),
        {loc: true}
    );
    script.body.forEach(function(expr) {
        console.log(escodegen.generate(expr));
    });
}
