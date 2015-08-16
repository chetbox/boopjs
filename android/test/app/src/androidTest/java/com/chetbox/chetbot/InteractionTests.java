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
        exec("wait(1)"); // TODO: this should not be necessary

        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("stop"));

        exec("tap(_startStopButton_)");
        exec("wait(1)"); // TODO: this should not be necessary

        assertThat(startStopButton.getText().toString(),
                equalToIgnoringCase("start"));
    }

}
