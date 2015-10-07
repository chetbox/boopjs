package com.chetbox.chetbot.test;

import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

public class StopwatchFragment extends Fragment {

    private Handler mHandler;
    private TextView mMinutesText;
    private TextView mSecondsText;
    private TextView mMillisecondsText;
    private Button mStartStopButton;
    private Button mResetButton;
    private ProgressBar mProgressBar;

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
        long elapsedNanos = mPreviousElapsed
                + (mRunning ? System.nanoTime() : mStoppedAt)
                - mStartedAt;
        return elapsedNanos / 1000000;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setHasOptionsMenu(true);

        mHandler = new Handler();
    }

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.stopwatch, container, false);

        mMinutesText = (TextView) view.findViewById(R.id.minutes);
        mSecondsText = (TextView) view.findViewById(R.id.seconds);
        mMillisecondsText = (TextView) view.findViewById(R.id.milliseconds);
        mStartStopButton = (Button) view.findViewById(R.id.start_stop);
        mResetButton = (Button) view.findViewById(R.id.reset);
        mProgressBar = (ProgressBar) view.findViewById(R.id.progress);

        mStartStopButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mRunning = !mRunning;
                if (mRunning) {
                    // timer started
                    mPreviousElapsed += mStoppedAt - mStartedAt;
                    mStartedAt = System.nanoTime();
                    mStartStopButton.setText(R.string.stop);
                    mProgressBar.setVisibility(View.VISIBLE);
                    mHandler.post(mUpdateTimerTextTask);
                } else {
                    // timer stopped
                    mStoppedAt = System.nanoTime();
                    mStartStopButton.setText(R.string.start);
                    mProgressBar.setVisibility(View.INVISIBLE);
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

        return view;
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.menu_stopwatch, menu);
        super.onCreateOptionsMenu(menu, inflater);
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
