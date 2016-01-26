package com.chetbox.chetbot.test;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity implements AdapterView.OnItemClickListener {

    private List<Screen> mScreens = new ArrayList<>();
    private DrawerLayout mDrawerLayout;
    private ListView mDrawerList;

    private static class Screen {
        public final int id;
        public final String name;
        public final Fragment fragment;

        @Override
        public String toString() {
            return name;
        }

        Screen(int id, String name, Fragment fragment) {
            this.id = id;
            this.name = name;
            this.fragment = fragment;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        mScreens.add(new Screen(Intents.SCREEN_STOPWATCH, getString(R.string.stopwatch), new StopwatchFragment()));
        mScreens.add(new Screen(Intents.SCREEN_TEXTFIELDS, getString(R.string.text_fields), new TextFieldsFragment()));
        mScreens.add(new Screen(Intents.SCREEN_ALERTS, getString(R.string.alerts), new AlertsFragment()));
        mScreens.add(new Screen(Intents.SCREEN_WEBVIEW, getString(R.string.web), new WebFragment()));

        mDrawerLayout = (DrawerLayout) findViewById(R.id.drawer_layout);

        mDrawerList = (ListView) findViewById(R.id.drawer);
        mDrawerList.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, mScreens));
        mDrawerList.setOnItemClickListener(this);

        int screenToShow = 0;
        Intent intent = getIntent();
        if (intent.hasExtra(Intents.SHOW_SCREEN)) {
            int screenRequested = intent.getIntExtra(Intents.SHOW_SCREEN, -1);
            for (int i=0; i<mScreens.size(); i++) {
                if (screenRequested == mScreens.get(i).id) {
                    screenToShow = i;
                    break;
                }
            }
        }

        // Open the first screen
        mDrawerList.performItemClick(
                mDrawerList.getChildAt(screenToShow),
                screenToShow,
                mDrawerList.getItemIdAtPosition(screenToShow));
    }

    @Override
    public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
        Fragment fragment = mScreens.get(i).fragment;
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.content_frame, fragment)
                .commit();

        mDrawerLayout.closeDrawer(mDrawerList);
    }

}
