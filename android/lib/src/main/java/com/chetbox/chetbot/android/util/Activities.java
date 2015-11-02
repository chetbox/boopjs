package com.chetbox.chetbot.android.util;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.support.test.espresso.core.deps.guava.util.concurrent.Uninterruptibles;
import android.util.ArrayMap;
import android.util.Log;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.concurrent.TimeUnit;

public class Activities {

    private static final String TAG = Activities.class.getSimpleName();

    public static Activity getActivity(String packageName) {
        final int maxTries = 5;
        int tryCount = 0;
        while (true) {
            try {
                return _getActivity(packageName);
            } catch (ActivityNotFoundException e) {
                if (++tryCount == maxTries) {
                    throw new RuntimeException("Failed to get activity after " + tryCount + " attempts", e);
                }
            }
            Uninterruptibles.sleepUninterruptibly(50, TimeUnit.MILLISECONDS);
        }
    }

    private static Activity _getActivity(String packageName) throws ActivityNotFoundException {
        // based on https://androidreclib.wordpress.com/2014/11/22/getting-the-current-activity/
        try {
            Class activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
            Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
            activitiesField.setAccessible(true);
            // TODO: handle API < 19
            // (ArrayMap is new for API 19)
            ArrayMap activities = (ArrayMap) activitiesField.get(activityThread);
            for (Object activityRecord : activities.values()) {
                Class activityRecordClass = activityRecord.getClass();
                Field pausedField = activityRecordClass.getDeclaredField("paused");
                pausedField.setAccessible(true);
                if (!pausedField.getBoolean(activityRecord)) {
                    Field activityField = activityRecordClass.getDeclaredField("activity");
                    activityField.setAccessible(true);
                    Activity activity = (Activity) activityField.get(activityRecord);
                    if (activity.getPackageName().equals(packageName)) {
                        return activity;
                    } else {
                        Log.v(TAG, "Found activity for different package: " + activity.getPackageName());
                    }
                }
            }
        } catch (ClassNotFoundException
                |NoSuchMethodException
                |IllegalAccessException
                |InvocationTargetException
                |NoSuchFieldException e) {

            throw new RuntimeException(e);
        }
        throw new ActivityNotFoundException("package:" + packageName);
    }

}
