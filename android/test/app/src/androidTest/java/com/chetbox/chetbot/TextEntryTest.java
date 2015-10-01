package com.chetbox.chetbot;

import android.support.test.runner.AndroidJUnit4;
import android.widget.Button;

import com.chetbox.chetbot.base.TextFieldsTest;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.sameInstance;

@RunWith(AndroidJUnit4.class)
public class TextEntryTest extends TextFieldsTest {

    @Test public void typeInTextField() {
        exec("tap('text')");
        exec("type_text('Once upon a time...')");

        assertThat(textField.getText().toString(),
                equalTo("Once upon a time..."));
    }

    @Test public void typeInPasswordField() {
        exec("tap('password')");
        exec("type_text('my!secret*passw0rd')");

        assertThat(passwordField.getText().toString(),
                equalTo("my!secret*passw0rd"));
    }

}

