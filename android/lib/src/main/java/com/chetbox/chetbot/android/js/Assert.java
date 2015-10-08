package com.chetbox.chetbot.android.js;

public class Assert {

    public static String source() {
        return "function assert_true(o) {\n" +
                "  if (!o) { throw (o + ' is not truthy'); }\n" +
                "}\n" +
                "function assert_false(o) {\n" +
                "  if (o) { throw (o + ' is truthy'); }\n" +
                "}\n" +
                "function assert_equal(a, b) {\n" +
                "  if (a != b) { throw (a + ' != ' + b); }\n" +
                "}\n" +
                "function assert_visible(selector) {\n" +
                "  assert_true(visible(selector));\n" +
                "}\n";
    }

}
