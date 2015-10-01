package com.chetbox.chetbot;

import com.chetbox.chetbot.base.screens.AlertsTest;

import org.junit.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class MultiWindowTest extends AlertsTest {

    @Test public void tapAlertButton() {
        assertThat(status.getText().toString(),
                equalTo("Undefined"));

        exec("tap('confirmation')");
        exec("tap('OK')");

        assertThat(status.getText().toString(),
                equalTo("OK"));
    }

}

