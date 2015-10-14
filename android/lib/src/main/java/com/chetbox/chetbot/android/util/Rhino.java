package com.chetbox.chetbot.android.util;

import org.mozilla.javascript.Wrapper;

public class Rhino {

    public static Object unwrapJavaObject(Object o) {
        return (o instanceof Wrapper) ? ((Wrapper) o).unwrap() : o;
    }

}
