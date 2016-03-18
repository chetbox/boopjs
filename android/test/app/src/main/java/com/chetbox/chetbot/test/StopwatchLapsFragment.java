package com.chetbox.chetbot.test;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;


public class StopwatchLapsFragment extends Fragment {

    private RecyclerView mLapsView;
    private StopwatchLapsAdapter mLapsAdapter;

    private LinearLayoutManager mLayoutManager;

    public StopwatchLapsFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        View view = inflater.inflate(R.layout.stopwatch_laps, container, false);

        mLapsAdapter = new StopwatchLapsAdapter();

        mLapsView = (RecyclerView) view.findViewById(R.id.laps);
        mLapsView.setHasFixedSize(true);
        mLapsView.setAdapter(mLapsAdapter);

        mLayoutManager = new LinearLayoutManager(getActivity());
        mLapsView.setLayoutManager(mLayoutManager);

        return view;
    }

    public final StopwatchLapsAdapter getAdapter() {
        return mLapsAdapter;
    }

}
