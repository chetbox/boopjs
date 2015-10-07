package com.chetbox.chetbot;

import android.support.v4.view.GravityCompat;
import android.widget.EditText;

import com.chetbox.chetbot.android.util.Activities;
import com.chetbox.chetbot.base.screens.StopwatchTest;
import com.chetbox.chetbot.test.R;

import org.junit.Test;
import org.mozilla.javascript.JavaScriptException;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.equalToIgnoringCase;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.isA;
import static org.hamcrest.Matchers.nullValue;

public class InteractionTests extends StopwatchTest {

    @Test public void tapToggleButton() {
        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("start"));

        exec("tap(_startStopButton_)");

        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("stop"));

        exec("tap(_startStopButton_)");

        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("start"));
    }

    @Test public void waitUntilIdle() {
        exec(   "tap(_startStopButton_);",
                "tap(_startStopButton_);",
                "wait_until_idle();");
    }

    @Test public void waitUntilIdleTimeout() {
        exec("tap(_startStopButton_)");

        exception.expect(Activities.TimeoutException.class);
        exec("wait_until_idle({timeout: 2})");
    }

    @Test public void waitSeconds() {
        long start = System.currentTimeMillis();
        exec("wait(0.5)");
        long stop = System.currentTimeMillis();

        assertThat((double) (stop - start),
                closeTo(500.0, 50.0));
    }

    @Test public void toast() {
        exec("toast('This should show something')");
    }

    @Test public void arbitraryJavaExecution() {
        assertThat((Integer) exec("java.util.Random().nextInt()"),
                isA(Integer.class));
    }

    @Test public void arbitraryUiThreadExecution() {
        exec(   "activity().runOnUiThread(function() {",
                "   Packages.android.widget.Toast.makeText(activity(), '" + name.getMethodName() + "', 0).show();",
                "})");
    }

    @Test public void openAndCloseDrawer() {
        assertThat(drawerLayout.isDrawerOpen(GravityCompat.START),
                is(false));

        exec("open_drawer()");

        assertThat(drawerLayout.isDrawerOpen(GravityCompat.START),
                is(true));

        exec("close_drawer()");

        assertThat(drawerLayout.isDrawerOpen(GravityCompat.START),
                is(false));
    }

    @Test public void openDrawerAndSelectItem() {
        // Initially showing Stopwatch
        assertThat(findViewById(R.id.email),
                nullValue());

        exec(   "open_drawer();",
                "tap('Text fields');");

        assertThat(findViewById(R.id.email),
                instanceOf(EditText.class));
    }

    @Test public void waitForViewCondition() {
        exec(   "tap('start');",
                "wait_for({id: 'seconds', text: '02'});",
                "tap('stop');");

        assertThat(secondsText.getText().toString(),
                equalTo("02"));
    }

    @Test(expected = JavaScriptException.class)
    public void waitForViewConditionTimeout() {
        exec(   "tap('start');",
                "wait_for({id: 'seconds', text: '03'}, {timeout: 2});");
    }

}
