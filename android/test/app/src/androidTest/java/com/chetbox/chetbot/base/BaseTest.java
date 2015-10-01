package com.chetbox.chetbot.base;

import android.app.Activity;
import android.content.Intent;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.view.View;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.test.MainActivity;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public abstract class BaseTest {

    public Intent withIntent(Intent intent) {
        return intent;
    }

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<MainActivity>(MainActivity.class) {
        @Override
        protected Intent getActivityIntent() {
            return withIntent(super.getActivityIntent());
        }
    };

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    private MainActivity activity;
    private Chetbot chetbot;

    int linesExecuted = 0;

    @Before
    public void setUp() {
        // These lines have to be done in this order
        activity = mActivityRule.getActivity();
        chetbot = Chetbot.getInstance(activity);
        chetbot.setTestActivity(activity);
        chetbot.onStartScript();
    }

    @After
    public void tearDown() {
        chetbot.onFinishScript();
        chetbot.reset();
    }

    protected Object exec(String stmt) {
        return chetbot.onStatement(new ChetbotServerConnection.Statement(stmt, ++linesExecuted), name.getMethodName());
    }

    protected View findViewById(int id) {
        return mActivityRule.getActivity().findViewById(id);
    }

    protected Activity getActivity() {
        return mActivityRule.getActivity();
    }

}
