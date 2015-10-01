package com.chetbox.chetbot.test;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.google.common.collect.ImmutableList;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

public class MainActivity extends AppCompatActivity implements AdapterView.OnItemClickListener {

    private LinkedHashMap<String, Fragment> mScreens = new LinkedHashMap<>();
    private List<String> mScreenNames = null;
    private DrawerLayout mDrawerLayout;
    private ListView mDrawerList;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.layout_main);

        mScreens.put(getString(R.string.stopwatch), new StopwatchFragment());
        mScreens.put(getString(R.string.text_fields), new TextFieldsFragment());

        mDrawerLayout = (DrawerLayout) findViewById(R.id.drawer_layout);

        mDrawerList = (ListView) findViewById(R.id.drawer);
        mDrawerList.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, screenNames()));
        mDrawerList.setOnItemClickListener(this);

        // Open the first screen
        mDrawerList.performItemClick(mDrawerList.getChildAt(0), 0, mDrawerList.getItemIdAtPosition(0));
    }

    @Override
    public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
        Fragment fragment = mScreens.get(screenNames().get(i));
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.content_frame, fragment)
                .commit();

        mDrawerLayout.closeDrawer(mDrawerList);
    }

    private List<String> screenNames() {
        if (mScreenNames == null) {
            ImmutableList.Builder<String> screenNames = new ImmutableList.Builder<>();
            for (Map.Entry<String, Fragment> screen : mScreens.entrySet()) {
                screenNames.add(screen.getKey());
            }
            mScreenNames = screenNames.build();
        }
        return mScreenNames;
    }

}
