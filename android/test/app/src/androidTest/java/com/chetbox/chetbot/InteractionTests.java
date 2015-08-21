package com.chetbox.chetbot;

import android.support.test.runner.AndroidJUnit4;
import android.view.View;

import com.chetbox.chetbot.base.StopwatchActivityTest;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

@RunWith(AndroidJUnit4.class)
public class InteractionTests extends StopwatchActivityTest {

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

}
