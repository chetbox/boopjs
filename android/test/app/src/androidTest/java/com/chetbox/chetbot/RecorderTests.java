package com.chetbox.chetbot;

import android.view.View;

import com.chetbox.chetbot.base.screens.StopwatchTest;

import org.junit.Test;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptableObject;

import static com.chetbox.chetbot.util.GenericMatchers.*;
import static org.hamcrest.MatcherAssert.assertThat;

public class RecorderTests extends StopwatchTest {

    private static final String TAG = RecorderTests.class.getSimpleName();

    @Test public void recordStart() {
        runOnUiThreadAfter(100, new Runnable() {
            @Override
            public void run() {
                startStopButton.performClick();
            }
        });

        NativeObject interaction = exec("wait_for_interaction()");

        assertThat(ScriptableObject.getTypedProperty(interaction, "type", String.class),
                equalTo("tap"));
        assertThat(ScriptableObject.getTypedProperty(interaction, "target", View.class),
                is(startStopButton));

        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("stop"));
    }

    @Test public void listenerAddedOnlyOnce() {
        Object originalListener = exec("__get_listener('OnClickListener', _startStopButton_)");
        exec("watch_interactions();");
        Object newListener = exec("__get_listener('OnClickListener', _startStopButton_)");

        assertThat(newListener, not(is(originalListener)));

        exec("watch_interactions();");
        Object newNewListener = exec("__get_listener('OnClickListener', _startStopButton_)");
        assertThat(newNewListener, is(newListener));
    }

    @Test public void watchTaps() {
        exec(   "start_recorder(function(e) { console.log(e.type, e.target); });",
                "tap('start');",
                "wait(2);",
                "tap('stop');",
                "wait(2);",
                "tap('reset');",
                "wait(2);");
    }

    @Test public void watchText() {
        exec(   "start_recorder(function(e) { console.log(e.type, JSON.stringify(e.keys + ''), e.target); });",
                "open_drawer();",
                "tap('text fields');",
                "tap('text');",
                "type_text('banana cake');",
                "press('backspace');",
                "press('backspace');",
                "wait(2);");
    }

}
