package com.chetbox.chetbot.base;

import android.support.test.rule.ActivityTestRule;
import android.widget.Button;
import android.widget.TextView;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.stopwatch.R;
import com.chetbox.chetbot.stopwatch.StopwatchActivity;

import org.junit.*;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;

public abstract class StopwatchActivityTest {

    @Rule
    public ActivityTestRule<StopwatchActivity> mActivityRule = new ActivityTestRule(StopwatchActivity.class);

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    protected StopwatchActivity activity;
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
        Chetbot.setOfflineMode(true);
        Chetbot.setTestActivity(activity);
        activity = mActivityRule.getActivity();

        StopwatchActivity activity = mActivityRule.getActivity();
        resetButton = (Button) activity.findViewById(R.id.reset);
        startStopButton = (Button) activity.findViewById(R.id.start_stop);
        minutesText = (TextView) activity.findViewById(R.id.minutes);
        secondsText = (TextView) activity.findViewById(R.id.seconds);
        millisecondsText = (TextView) activity.findViewById(R.id.milliseconds);

        chetbot = Chetbot.getInstance();
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

}
