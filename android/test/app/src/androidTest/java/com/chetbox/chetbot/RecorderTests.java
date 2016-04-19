package com.chetbox.chetbot;

import android.view.View;

import com.chetbox.chetbot.base.screens.StopwatchTest;
import static com.chetbox.chetbot.util.RecorderEvents.*;

import org.junit.Test;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptableObject;

import java.util.List;

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

    @Test public void watchForTaps() {
        recordEvents(this, new RecordEvents() {
            @Override
            public void record() {
                exec(
                        "tap('start');",
                        "wait(2);",
                        "tap('stop');",
                        "wait(2);",
                        "tap('reset');");
            }

            @Override
            public void then(List<NativeObject> events) {
                assertThat(taps(events), contains(startStopButton, startStopButton, resetButton));
            }
        });
    }

    @Test public void watchForKeyboardInput() {
        exec(
                "open_drawer();",
                "tap('text fields');",
                "tap('text');");

        recordEvents(this, new RecordEvents() {
            @Override
            public void record() {
                exec(
                        "type_text('banana cake');",
                        "press('backspace');",
                        "press('backspace');");
            }

            @Override
            public void then(List<NativeObject> events) {
                assertThat(keys(events), contains("B", "a", "n", "a", "n", "a", " ", "c", "a", "k", "e", "\b", "\b"));
            }
        });
    }

    @Test public void openAndCloseDrawer() {
        recordEvents(this, new RecordEvents() {
            @Override
            public void record() {
                exec(
                        "open_drawer();",
                        "close_drawer();");
            }

            @Override
            public void then(List<NativeObject> events) {
                assertThat(events.size(), is(2));

                assertThat(events.get(0).get("type"), equalTo("drawer"));
                assertThat(events.get(0).get("action"), equalTo("open"));
                assertThat(events.get(0).get("target"), is(drawerLayout));

                assertThat(events.get(1).get("type"), equalTo("drawer"));
                assertThat(events.get(1).get("action"), equalTo("close"));
                assertThat(events.get(1).get("target"), is(drawerLayout));
            }
        });
    }

}
