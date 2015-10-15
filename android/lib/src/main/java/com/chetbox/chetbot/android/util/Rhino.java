package com.chetbox.chetbot.android.util;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Wrapper;

public class Rhino {

    public static Object unwrapJavaObject(Object o) {
        return (o instanceof Wrapper)
                ? ((Wrapper) o).unwrap()
                : o;
    }

    public static Object wrapJavaObject(Object o, Context context, Scriptable scope) {
        return (o != null)
                ? context.toObject(o, scope)
                : null;
    }

}
