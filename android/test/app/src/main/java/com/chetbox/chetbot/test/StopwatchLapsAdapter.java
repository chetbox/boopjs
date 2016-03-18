package com.chetbox.chetbot.test;

import android.support.test.espresso.core.deps.guava.collect.Lists;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;

public class StopwatchLapsAdapter extends RecyclerView.Adapter<StopwatchLapsAdapter.ViewHolder> {

    private static final SimpleDateFormat sTimeFormat = new SimpleDateFormat("HH:mm:SSS", Locale.ENGLISH);

    private final LinkedList<Long> mLaps;

    public static class ViewHolder extends RecyclerView.ViewHolder {
        public TextView mLapNumber;
        public TextView mLapTime;
        public TextView mTotalTime;

        public ViewHolder(View v) {
            super(v);
            mLapNumber = (TextView) v.findViewById(R.id.lap_number);
            mLapTime = (TextView) v.findViewById(R.id.lap_time);
            mTotalTime = (TextView) v.findViewById(R.id.total_time);
        }
    }

    public StopwatchLapsAdapter() {
        this(new LinkedList<Long>());
    }

    public StopwatchLapsAdapter(List<Long> laps) {
        mLaps = Lists.newLinkedList(laps);
    }

    @Override
    public StopwatchLapsAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.stopwatch_lap_item, parent, false);
        return new ViewHolder(v);
    }

    private static String formatTime(long elapsedMillis) {
        return String.format(Locale.ENGLISH, "%02d:%02d:%03d",
                elapsedMillis / 60000,
                (elapsedMillis % 60000) / 1000,
                elapsedMillis % 1000);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        long    totalTime = mLaps.get(position),
                previousTotalTime = (position >= 1 ? mLaps.get(position - 1) : 0),
                lapTime = totalTime - previousTotalTime;

        holder.mLapNumber.setText(Integer.toString(position + 1));
        holder.mLapTime.setText(formatTime(lapTime));
        holder.mTotalTime.setText(formatTime(totalTime));
    }

    @Override
    public int getItemCount() {
        return mLaps.size();
    }

    public void addLap(long totalMillis) {
        mLaps.add(totalMillis);
        notifyItemInserted(mLaps.size() - 1);
    }

    public void clearLaps() {
        mLaps.clear();
        notifyDataSetChanged();
    }
}
