package com.chetbox.chetbot.base;

import android.content.Intent;
import android.support.test.rule.ActivityTestRule;
import android.widget.EditText;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.test.Intents;
import com.chetbox.chetbot.test.MainActivity;
import com.chetbox.chetbot.test.R;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;

public class TextFieldsTest {

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<MainActivity>(MainActivity.class) {
        @Override
        protected Intent getActivityIntent() {
            Intent intent = super.getActivityIntent();
            intent.putExtra(Intents.SHOW_SCREEN, Intents.SCREEN_TEXTFIELDS);
            return intent;
        }
    };

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    protected MainActivity activity;
    protected Chetbot chetbot;
    protected EditText textField;
    protected EditText emailField;
    protected EditText numberField;
    protected EditText passwordField;

    int linesExecuted = 0;

    @Before
    public void setUp() {
        // These lines have to be done in this order
        activity = mActivityRule.getActivity();
        chetbot = Chetbot.getInstance(activity);
        chetbot.setTestActivity(activity);

        MainActivity activity = mActivityRule.getActivity();
        textField = (EditText) activity.findViewById(R.id.text);
        emailField = (EditText) activity.findViewById(R.id.email);
        numberField = (EditText) activity.findViewById(R.id.number);
        passwordField = (EditText) activity.findViewById(R.id.password);

        chetbot.onStartScript();
    }

    @After
    public void tearDown() {
        exec("hide_keyboard()");
        chetbot.onFinishScript();
        chetbot.reset();
    }

    protected Object exec(String stmt) {
        return chetbot.onStatement(new ChetbotServerConnection.Statement(stmt, ++linesExecuted), name.getMethodName());
    }

}
