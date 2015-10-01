package com.chetbox.chetbot;

import android.support.test.runner.AndroidJUnit4;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.widget.EditText;

import com.chetbox.chetbot.android.util.Activities;
import com.chetbox.chetbot.base.StopwatchTest;
import com.chetbox.chetbot.test.R;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

@RunWith(AndroidJUnit4.class)
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
        exec("tap(_startStopButton_)");
        exec("tap(_startStopButton_)");

        exec("wait_until_idle()");
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
        exec("activity().runOnUiThread(function() {\n" +
             "   Packages.android.widget.Toast.makeText(activity(), '" + name.getMethodName() + "', 0).show();\n" +
             "})");
    }

    @Test public void openAndCloseDrawer() {
        assertThat(((DrawerLayout) findViewById(R.id.drawer_layout)).isDrawerOpen(GravityCompat.START),
                is(false));

        exec("open_drawer()");

        assertThat(((DrawerLayout) findViewById(R.id.drawer_layout)).isDrawerOpen(GravityCompat.START),
                is(true));

        exec("close_drawer()");

        assertThat(((DrawerLayout) findViewById(R.id.drawer_layout)).isDrawerOpen(GravityCompat.START),
                is(false));
    }

    @Test public void openDrawerAndSelectItem() {
        // Initially showing Stopwatch
        assertThat(findViewById(R.id.email),
                nullValue());

        exec("open_drawer()");
        exec("tap('Text fields')");

        assertThat(findViewById(R.id.email),
                instanceOf(EditText.class));
    }

}
