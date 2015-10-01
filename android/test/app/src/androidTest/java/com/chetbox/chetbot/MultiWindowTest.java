package com.chetbox.chetbot;

import android.support.test.runner.AndroidJUnit4;

import com.chetbox.chetbot.base.AlertsTest;
import com.chetbox.chetbot.base.TextFieldsTest;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@RunWith(AndroidJUnit4.class)
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

