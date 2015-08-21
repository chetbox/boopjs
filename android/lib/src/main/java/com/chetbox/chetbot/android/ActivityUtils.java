package com.chetbox.chetbot.android;

import android.app.Activity;
import android.os.Looper;
import android.os.Message;
import android.os.MessageQueue;
import android.util.ArrayMap;
import android.util.Log;

import com.google.android.apps.common.testing.ui.espresso.base.QueueInterrogator;

import java.lang.reflect.Field;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class ActivityUtils {

    private static final String TAG = ActivityUtils.class.getSimpleName();

    public static class TimeoutException extends RuntimeException {
        public TimeoutException(String message) {
            super(message);
        }
    }

    public static Activity getActivity(String packageName) {
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
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        throw new AssertionError("Activity not found");
    }

    public static void sleep(Double seconds) {
        try {
            Thread.sleep(Math.round(seconds * 1000.0));
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public static void waitUntilSettled(Activity activity) {
        waitUntilSettled(activity, 10, TimeUnit.SECONDS);
    }

    public static void waitUntilSettled(final Activity activity, final long timeout, final TimeUnit timeoutUnit) {
        final CountDownLatch idleLatch = new CountDownLatch(1);
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Looper.myQueue().addIdleHandler(new MessageQueue.IdleHandler() {
                    @Override
                    public boolean queueIdle() {
                        idleLatch.countDown();
                        return false; // Do not repeat
                    }
                });
            }
        });
        try {
            if (!idleLatch.await(timeout, timeoutUnit)) {
                throw new TimeoutException("UI was not idle after " + timeout + " " + timeoutUnit);
            }
        } catch (InterruptedException e) {
           throw new RuntimeException(e);
        }
    }

    public static void waitUntilIdle(Activity activity) {
        waitUntilIdle(activity, 10, TimeUnit.SECONDS);
    }

    public static void waitUntilIdle(final Activity activity, final long timeout, final TimeUnit timeoutUnit) {
        final QueueInterrogator mainQueueInterrogator = new QueueInterrogator(activity.getMainLooper());
        final CountDownLatch idleLatch = new CountDownLatch(1);
        final Container<MessageQueue> mainMessageQueueContainer = new Container<>();
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mainMessageQueueContainer.setContent(Looper.myQueue());
            }
        });
        mainMessageQueueContainer.waitForContent().addIdleHandler(new MessageQueue.IdleHandler() {
            @Override
            public boolean queueIdle() {
                // Inspired by https://android.googlesource.com/platform/frameworks/testing/+/61a929bd4642b9042bfb05b85340c1761ab90733/espresso/espresso-lib/src/main/java/com/google/android/apps/common/testing/ui/espresso/base/LooperIdlingResource.java
                QueueInterrogator.QueueState queueState = mainQueueInterrogator.determineQueueState();
                if (queueState == QueueInterrogator.QueueState.EMPTY || queueState == QueueInterrogator.QueueState.TASK_DUE_LONG) {
                    // no block and no task coming 'shortly'.
                    idleLatch.countDown();
                    return false;
                } else {
                    // Try again later
                    return true;
                }
            }
        });
        try {
            if (!idleLatch.await(timeout, timeoutUnit)) {
                throw new TimeoutException("UI was not idle after " + timeout + " " + timeoutUnit);
            }
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

}
