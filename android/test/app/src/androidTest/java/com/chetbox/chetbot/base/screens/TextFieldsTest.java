package com.chetbox.chetbot.base.screens;

import android.content.Intent;
import android.widget.EditText;

import com.chetbox.chetbot.base.BaseTest;
import com.chetbox.chetbot.test.Intents;
import com.chetbox.chetbot.test.R;

public abstract class TextFieldsTest extends BaseTest {

    @Override
    public Intent withIntent(Intent intent) {
        intent.putExtra(Intents.SHOW_SCREEN, Intents.SCREEN_TEXTFIELDS);
        return intent;
    }

    protected EditText textField;
    protected EditText emailField;
    protected EditText numberField;
    protected EditText passwordField;

    @Override
    public void setUp() {
        super.setUp();
        textField = (EditText) findViewById(R.id.text);
        emailField = (EditText) findViewById(R.id.email);
        numberField = (EditText) findViewById(R.id.number);
        passwordField = (EditText) findViewById(R.id.password);
    }

    @Override
    public void tearDown() {
        exec("hide_keyboard()");
        super.tearDown();
    }
}
