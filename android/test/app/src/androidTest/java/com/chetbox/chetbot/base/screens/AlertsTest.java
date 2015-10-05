package com.chetbox.chetbot.base.screens;

import android.content.Intent;
import android.widget.TextView;

import com.chetbox.chetbot.base.BaseTest;
import com.chetbox.chetbot.test.Intents;
import com.chetbox.chetbot.test.R;

public abstract class AlertsTest extends BaseTest {

    @Override
    public Intent withIntent(Intent intent) {
        intent.putExtra(Intents.SHOW_SCREEN, Intents.SCREEN_ALERTS);
        return intent;
    }

    protected TextView status;

    @Override
    public void setUp() {
        super.setUp();
        status = (TextView) findViewById(R.id.status);
    }

}
