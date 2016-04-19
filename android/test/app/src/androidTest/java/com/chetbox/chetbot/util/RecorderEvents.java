package com.chetbox.chetbot.util;

import android.os.SystemClock;
import android.support.test.espresso.core.deps.guava.base.Function;
import android.support.test.espresso.core.deps.guava.collect.Collections2;
import android.view.View;

import com.chetbox.chetbot.android.util.Rhino;
import com.chetbox.chetbot.base.BaseTest;

import org.hamcrest.BaseMatcher;
import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.mozilla.javascript.NativeObject;

import java.util.Collection;
import java.util.List;


public class RecorderEvents {

    public interface RecordEvents {
        void record();
        void then(List<NativeObject> events);
    }

    public static void recordEvents(BaseTest test, RecordEvents recordEvents) {
        test.exec(  "var _events = [];",
                    "start_recorder(function(e) { _events.push(e); });");
        recordEvents.record();
        SystemClock.sleep(1000);
        List<NativeObject> events = test.exec("_events");
        recordEvents.then(events);
    }

    public static Collection<String> types(Collection<NativeObject> events) {
        return Collections2.transform(events, new Function<NativeObject, String>() {
            @Override
            public String apply(NativeObject event) {
                return Rhino.unwrapJavaObject(event.get("type")).toString();
            }
        });
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

    public static Matcher<NativeObject> tap(final View view) {
        return new BaseMatcher<NativeObject>() {
            @Override
            public boolean matches(Object _event) {
                NativeObject event = (NativeObject) _event;
                return event.get("type").toString().equals("tap") &&
                        Rhino.unwrapJavaObject(event.get("view")) == view;
            }

            @Override
            public void describeTo(Description description) {
                description.appendText("view tapped: ").appendValue(view);
            }
        };
    }

    public static Matcher<NativeObject> key(final String keys) {
        return new BaseMatcher<NativeObject>() {
            @Override
            public boolean matches(Object _event) {
                NativeObject event = (NativeObject) _event;
                return event.get("type").toString().equals("press") &&
                        event.get("keys").toString().equals(keys);
            }

            @Override
            public void describeTo(Description description) {
                description.appendText("key pressed: ").appendValue(keys);
            }
        };
    }

}
