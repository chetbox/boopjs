package com.chetbox.chetbot.android.js;

import android.support.test.espresso.core.deps.guava.base.Joiner;

public class Wait {

    public static String source() {
        return Joiner.on("\n").join(

                "function wait(seconds) {",
                "  Packages.java.lang.Thread.sleep(seconds * 1000);",
                "}",
                "",
                "function wait_for(selector, options) {",
                "  var timeout = (options && options.timeout) || 60;",
                "  var start = Packages.android.os.SystemClock.uptimeMillis();",
                "  while (!visible(selector)) {",
                "    if ((Packages.android.os.SystemClock.uptimeMillis() - start) > (timeout * 1000)) {",
                "      throw 'Timeout expired';",
                "    } else {",
                "      wait(0.05);",
                "    }",
                "  }",
                "}"

        );
    }
}
