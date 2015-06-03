package com.chetbox.chetbot.stopwatch;

import android.os.Bundle;
import android.os.Handler;
import android.support.v7.app.AppCompatActivity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.chetbox.chetbot.android.ChetBot;


public class Stopwatch extends AppCompatActivity {

    private Handler mHandler;
    private TextView mMinutesText;
    private TextView mSecondsText;
    private TextView mMillisecondsText;
    private Button mStartStopButton;
    private Button mResetButton;

    private boolean mRunning;
    private long mPreviousElapsed;
    private long mStartedAt;
    private long mStoppedAt;

    private Runnable mUpdateTimerTextTask = new Runnable() {
        public void run() {
            long elapsedMillis = elapsedMillis();
            mMinutesText.setText(String.format("%02d", elapsedMillis / 60000));
            mSecondsText.setText(String.format("%02d", (elapsedMillis % 60000) / 1000));
            mMillisecondsText.setText(String.format("%03d", elapsedMillis % 1000));
            if (mRunning) {
                mHandler.postDelayed(mUpdateTimerTextTask, 10);
            }
        }
    };

    private long elapsedMillis() {
        long elapsedNanos = mPreviousElapsed + (mRunning ? System.nanoTime() : mStoppedAt) - mStartedAt;
        return elapsedNanos / 1000000;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ChetBot.start(this);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.layout_stopwatch);

        mHandler = new Handler();
        mMinutesText = (TextView) findViewById(R.id.minutes);
        mSecondsText = (TextView) findViewById(R.id.seconds);
        mMillisecondsText = (TextView) findViewById(R.id.milliseconds);
        mStartStopButton = (Button) findViewById(R.id.start_stop);
        mResetButton = (Button) findViewById(R.id.reset);

        mStartStopButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mRunning = !mRunning;
                if (mRunning) {
                    // timer started
                    mPreviousElapsed = mStoppedAt - mStartedAt;
                    mStartedAt = System.nanoTime();
                    mStartStopButton.setText(R.string.stop);
                    mHandler.post(mUpdateTimerTextTask);
                } else {
                    // timer stopped
                    mStoppedAt = System.nanoTime();
                    mStartStopButton.setText(R.string.start);
                }
                mResetButton.setEnabled(!mRunning);
            }
        });

        // Reset button
        mResetButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mPreviousElapsed = 0;
                mStartedAt = mStoppedAt = System.nanoTime();
                mHandler.post(mUpdateTimerTextTask);
            }
        });

        mRunning = false;
        mResetButton.callOnClick();

        /* DEBUGGING */

//        new Thread(new Runnable() {
//            @Override
//            public void run() {
//                try {
//                    Thread.sleep(4000);
//                    for (int i=1; i<=5; i++) {
//                        ChetBot.get().tap("start");
//                        Thread.sleep(i * 1000);
//                        ChetBot.get().tap("stop");
//                        Thread.sleep(1000);
//                        ChetBot.get().tap("reset");
//                        Thread.sleep(1000);
//                    }
//                } catch (InterruptedException e) {}
//            }
//        }).start();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_stopwatch, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }
}
