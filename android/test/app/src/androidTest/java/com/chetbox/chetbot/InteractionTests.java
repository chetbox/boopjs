package com.chetbox.chetbot;

import android.support.v4.view.GravityCompat;
import android.widget.EditText;

import com.chetbox.chetbot.base.screens.StopwatchTest;
import com.chetbox.chetbot.test.R;

import org.junit.Test;
import org.mozilla.javascript.JavaScriptException;

import java.util.concurrent.CountDownLatch;

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

    @Test public void tapXYCoord() {
        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("start"));

        int[] location = new int[2];
        startStopButton.getLocationOnScreen(location);
        int centerX = location[0] + startStopButton.getWidth() / 2,
            centerY = location[1] + startStopButton.getHeight() / 2;

        exec("tap([" + centerX + ", " + centerY + "])");

        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("stop"));
    }

    @Test public void swipeLeftRight() {
        assertThat(viewPager.getCurrentItem(), equalTo(0));
        exec("swipe_left()");
        assertThat(viewPager.getCurrentItem(), equalTo(1));
        exec("swipe_right()");
        assertThat(viewPager.getCurrentItem(), equalTo(0));
    }

    @Test public void swipeUpDown() {
        final CountDownLatch latch = new CountDownLatch(1);
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                startStopButton.performClick();
                for (int i = 0; i < 20; i++) {
                    lapButton.performClick();
                }
                viewPager.setCurrentItem(1);
                latch.countDown();
            }
        });
        try {
            latch.await();
            Thread.sleep(250);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        exec(   "swipe_up();",
                "wait_for('20');",
                "swipe_down();",
                "wait_for('1');");
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
                "tap('Text fields');",
                "wait_for({id: 'email'});");

        assertThat(findViewById(R.id.email),
                instanceOf(EditText.class));
    }

    @Test public void waitForView() {
        exec(   "tap('start');",
                "wait_for({id: 'seconds', text: '02'});",
                "tap('stop');");

        assertThat(secondsText.getText().toString(),
                equalTo("02"));
    }

    @Test(expected = JavaScriptException.class)
    public void waitForViewTimeout() {
        exec(   "tap('start');",
                "wait_for({id: 'seconds', text: '03'}, {timeout: 2});");
    }

    @Test public void waitForFunction() {
        exec(   "tap('start');",
                "wait_for(function() {",
                "  return text(_secondsText_) == '02';",
                "});",
                "tap('stop');");

        assertThat(secondsText.getText().toString(),
                equalTo("02"));
    }

    @Test(expected = JavaScriptException.class)
    public void waitForFunctionTimeout() {
        exec(   "tap('start');",
                "wait_for(function() {",
                "  return text(_secondsText_) == '03';",
                "}, {timeout: 2});",
                "tap('stop');");

        assertThat(secondsText.getText().toString(),
                equalTo("02"));
    }

}
