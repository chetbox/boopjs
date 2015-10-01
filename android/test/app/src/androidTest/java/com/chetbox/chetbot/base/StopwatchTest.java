package com.chetbox.chetbot.base;

import android.content.Intent;
import android.support.test.rule.ActivityTestRule;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.test.Intents;
import com.chetbox.chetbot.test.MainActivity;
import com.chetbox.chetbot.test.R;

import org.junit.*;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;

public abstract class StopwatchTest {

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<MainActivity>(MainActivity.class) {
        @Override
        protected Intent getActivityIntent() {
            Intent intent = super.getActivityIntent();
            intent.putExtra(Intents.SHOW_SCREEN, Intents.SCREEN_STOPWATCH);
            return intent;
        }
    };

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    protected MainActivity activity;
    protected Chetbot chetbot;
    protected Button resetButton;
    protected Button startStopButton;
    protected TextView minutesText;
    protected TextView secondsText;
    protected TextView millisecondsText;

    int linesExecuted = 0;

    @Before
    public void setUp() {
        // These lines have to be done in this order
        activity = mActivityRule.getActivity();
        chetbot = Chetbot.getInstance(activity);
        chetbot.setTestActivity(activity);

        MainActivity activity = mActivityRule.getActivity();
        resetButton = (Button) activity.findViewById(R.id.reset);
        startStopButton = (Button) activity.findViewById(R.id.start_stop);
        minutesText = (TextView) activity.findViewById(R.id.minutes);
        secondsText = (TextView) activity.findViewById(R.id.seconds);
        millisecondsText = (TextView) activity.findViewById(R.id.milliseconds);

        chetbot.onStartScript();

        // Handy references to views in the layout
        exec("var _startStopButton_ = view({id: 'start_stop'});");
        exec("var _resetButton_ = view({id: 'reset'});");
        exec("var _minutesText_ = view({id: 'minutes'});");
        exec("var _secondsText_ = view({id: 'seconds'});");
        exec("var _millisecondsText_ = view({id: 'milliseconds'});");
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

}
