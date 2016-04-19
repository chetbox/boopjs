package com.chetbox.chetbot.util;

import android.os.SystemClock;
import android.support.test.espresso.core.deps.guava.base.Function;
import android.support.test.espresso.core.deps.guava.collect.Collections2;
import android.view.View;

import com.chetbox.chetbot.android.util.Rhino;
import com.chetbox.chetbot.base.BaseTest;

import org.mozilla.javascript.NativeObject;

import java.util.Collection;

public class RecorderEvents {

    public interface RecordEvents {
        void record();
        void then(Collection<NativeObject> events);
    }

    public static void recordEvents(BaseTest test, RecordEvents recordEvents) {
        test.exec(  "var _events = [];",
                    "start_recorder(function(e) { _events.push(e); });");
        recordEvents.record();
        SystemClock.sleep(1000);
        Collection<NativeObject> events = test.exec("_events");
        recordEvents.then(events);
    }

    public static Collection<String> keys(Collection<NativeObject> events) {
        return Collections2.transform(events, new Function<NativeObject, String>() {
            @Override
            public String apply(NativeObject event) {
                return Rhino.unwrapJavaObject(event.get("keys")).toString();
            }
        });
    }

    public static Collection<View> taps(Collection<NativeObject> events) {
        return Collections2.transform(events, new Function<NativeObject, View>() {
            @Override
            public View apply(NativeObject event) {
                return (View) Rhino.unwrapJavaObject(event.get("target"));
            }
        });
    }

}
