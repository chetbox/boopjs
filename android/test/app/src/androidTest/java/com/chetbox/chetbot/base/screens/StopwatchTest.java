package com.chetbox.chetbot.base.screens;

import android.content.Intent;
import android.widget.Button;
import android.widget.TextView;

import com.chetbox.chetbot.base.BaseTest;
import com.chetbox.chetbot.test.Intents;
import com.chetbox.chetbot.test.R;

public abstract class StopwatchTest extends BaseTest {

    @Override
    public Intent withIntent(Intent intent) {
        intent.putExtra(Intents.SHOW_SCREEN, Intents.SCREEN_STOPWATCH);
        return intent;
    }

    protected Button resetButton;
    protected Button startStopButton;
    protected TextView minutesText;
    protected TextView secondsText;
    protected TextView millisecondsText;

    @Override
    public void setUp() {
        super.setUp();

        resetButton = (Button) findViewById(R.id.reset);
        startStopButton = (Button) findViewById(R.id.start_stop);
        minutesText = (TextView) findViewById(R.id.minutes);
        secondsText = (TextView) findViewById(R.id.seconds);
        millisecondsText = (TextView) findViewById(R.id.milliseconds);

        // Handy references to views in the layout
        exec("var _startStopButton_ = view({id: 'start_stop'});");
        exec("var _resetButton_ = view({id: 'reset'});");
        exec("var _minutesText_ = view({id: 'minutes'});");
        exec("var _secondsText_ = view({id: 'seconds'});");
        exec("var _millisecondsText_ = view({id: 'milliseconds'});");
    }

}
