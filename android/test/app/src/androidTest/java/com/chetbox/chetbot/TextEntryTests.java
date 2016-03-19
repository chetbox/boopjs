package com.chetbox.chetbot;

import com.chetbox.chetbot.base.screens.TextFieldsTest;

import org.junit.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class TextEntryTests extends TextFieldsTest {

    @Test public void typeInTextField() {
        exec(   "tap('text');",
                "type_text('Once upon a time...');");

        assertThat(textField.getText().toString(),
                equalTo("Once upon a time..."));
    }

    @Test public void typeInTextInputLayout() {
        exec(   "tap('password');",
                "type_text('my!secret*passw0rd');");

        assertThat(passwordField.getText().toString(),
                equalTo("my!secret*passw0rd"));
    }

    @Test public void typeInTextInputLayoutWithText() {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                // Cause hint to float about EditText
                passwordField.setText("hello");
            }
        });

        exec(   "tap('password');",
                "type_text(' world');");

        assertThat(passwordField.getText().toString(),
                equalTo("hello world"));
    }

    @Test public void typeInPopup() {
        exec(   "tap('popup');",
                "type_text('The end');",
                "tap('ok');");

        assertThat(popupText.getText().toString(),
                equalTo("The end"));
    }


}

