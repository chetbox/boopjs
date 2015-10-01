package com.chetbox.chetbot;

import com.chetbox.chetbot.base.screens.TextFieldsTest;

import org.junit.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

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

