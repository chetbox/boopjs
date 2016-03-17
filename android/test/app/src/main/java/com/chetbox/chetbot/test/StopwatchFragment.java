package com.chetbox.chetbot.test;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentStatePagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

public class StopwatchFragment extends Fragment {

    private ViewPager mPager;
    private StopwatchTimerFragment mTimerFragment;
    private StopwatchLapsFragment mLapsFragment;
    private StopwatchTimerFragment.Listener mTimerListener;

    private class StopwatchPagerAdapter extends FragmentStatePagerAdapter {

        public StopwatchPagerAdapter() {
            super(getActivity().getSupportFragmentManager());
        }

        @Override
        public Fragment getItem(int position) {
            return position == 0
                    ? mTimerFragment
                    : mLapsFragment;
        }

        @Override
        public int getCount() {
            return 2;
        }
    }


    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.stopwatch, container, false);

        mTimerFragment = new StopwatchTimerFragment();
        mLapsFragment = new StopwatchLapsFragment();

        // Record laps in Adapter
        mTimerListener = new StopwatchTimerFragment.Listener() {
            @Override
            public void onLap(long elapsed) {
                mLapsFragment.getAdapter().addLap(elapsed);
            }

            @Override
            void onReset() {
                StopwatchLapsAdapter adapter = mLapsFragment.getAdapter();
                if (adapter != null) {
                    adapter.clearLaps();
                }
            }
        };
        mTimerFragment.addListener(mTimerListener);

        mPager = (ViewPager) view.findViewById(R.id.pager);
        mPager.setAdapter(new StopwatchPagerAdapter());

        return view;
    }

    @Override
    public void onDestroyView() {
        mTimerFragment.removeListener(mTimerListener);
        mTimerListener = null;
        mTimerFragment = null;
        mLapsFragment = null;
        super.onDestroyView();
    }
}
