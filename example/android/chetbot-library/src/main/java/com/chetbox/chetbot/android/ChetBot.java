package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Context;
import android.util.ArrayMap;
import android.util.Log;
import android.view.View;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;

public class ChetBot {

    private static final String TAG = ChetBot.class.getSimpleName();

    private static ChetBot _instance = null;

    private final String mPackageName;

    private ChetBot(Context context) {
        mPackageName = context.getPackageName();

        // TODO: start web server
    }

    public static void start(Context context) {
        if (_instance == null) {
            _instance = new ChetBot(context);
        }
    }

    public static ChetBot get() {
        return _instance;
    }

    private Activity getActivity(){
        try {
            Class activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
            Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
            activitiesField.setAccessible(true);
            ArrayMap activities = (ArrayMap) activitiesField.get(activityThread);
            for (Object activityRecord : activities.values()) {
                Class activityRecordClass = activityRecord.getClass();
                Field pausedField = activityRecordClass.getDeclaredField("paused");
                pausedField.setAccessible(true);
                if (!pausedField.getBoolean(activityRecord)) {
                    Field activityField = activityRecordClass.getDeclaredField("activity");
                    activityField.setAccessible(true);
                    Activity activity = (Activity) activityField.get(activityRecord);
                    if (activity.getPackageName().equals(mPackageName)) {
                        return activity;
                    } else {
                        Log.w(TAG, "Found activity for different package: " + activity.getPackageName());
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return null;

        // The above code snippet lacks exception handling and naively assumes that the first
        // running Activity is the one we’re looking for. You might want to add some additional
        // checks.
    }

    private static View getRootView(Activity activity) {
        return activity.getWindow().getDecorView().findViewById(android.R.id.content);
    }

    public void tap(String text) {
        Activity activity = getActivity();
        final ArrayList<View> matchingViews = new ArrayList<View>();
        getRootView(activity).findViewsWithText(matchingViews, text, View.FIND_VIEWS_WITH_TEXT);

        if (matchingViews.size() == 0) {
            throw new RuntimeException("No view views found with text: " + text);
        }

        if (matchingViews.size() > 1) {
            Log.w(TAG, "Multiple views with text \"" + text + "\" found.");
            for (int i = 0; i < matchingViews.size(); i++) {
                Log.v(TAG, " - " + matchingViews.get(i));
            }
        }

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                matchingViews.get(0).callOnClick();
            }
        });
    }

}
