function run(editor) {
    var script = esprima.parse(
        editor.getSession().getDocument().getValue(),
        {loc: true}
    );
    script.body.forEach(function(expr) {
        var expr_str = escodegen.generate(expr);
        console.log(expr_str);
        eval(expr_str);
    });
}
