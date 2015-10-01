package com.chetbox.chetbot.android;

import android.app.Activity;
import android.os.Bundle;
import android.support.multidex.MultiDexApplication;
import android.support.test.internal.runner.lifecycle.ActivityLifecycleMonitorImpl;
import android.support.test.runner.lifecycle.ActivityLifecycleMonitorRegistry;
import android.support.test.runner.lifecycle.Stage;

import java.util.HashSet;
import java.util.Set;

public class ChetbotApplication extends MultiDexApplication {

    private ActivityLifecycleMonitorImpl mActivityLifecycleMonitor;
    private Set<Activity> mStartedActivities = new HashSet<>();

    private final ActivityLifecycleCallbacks mConnectWhenActivityCreated = new ActivityLifecycleCallbacks() {
        @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
            Chetbot.getInstance(activity).connect(activity);
            unregisterActivityLifecycleCallbacks(mConnectWhenActivityCreated);
        }

        @Override public void onActivityStarted(Activity activity) {}
        @Override public void onActivityResumed(Activity activity) {}
        @Override public void onActivityPaused(Activity activity) {}
        @Override public void onActivityStopped(Activity activity) {}
        @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) {}
        @Override public void onActivityDestroyed(Activity activity) {}
    };

    private final ActivityLifecycleCallbacks mActivityLifecycleMonitorCallbacks = new ActivityLifecycleCallbacks() {
        @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.PRE_ON_CREATE, activity);
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.CREATED, activity);
        }
        @Override public void onActivityStarted(Activity activity) {

            // If the activity has been started before
            if (mStartedActivities.contains(activity)) {
                mActivityLifecycleMonitor.signalLifecycleChange(Stage.RESTARTED, activity);
            } else {
                mStartedActivities.add(activity);
            }
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.STARTED, activity);
        }
        @Override public void onActivityResumed(Activity activity) {
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.RESUMED, activity);
        }
        @Override public void onActivityPaused(Activity activity) {
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.PAUSED, activity);
        }
        @Override public void onActivityStopped(Activity activity) {
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.STOPPED, activity);
        }
        @Override public void onActivityDestroyed(Activity activity) {
            mStartedActivities.remove(activity);
            mActivityLifecycleMonitor.signalLifecycleChange(Stage.DESTROYED, activity);
        }
        @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) {}
    };

    @Override
    public void onCreate() {
        super.onCreate();
        registerActivityLifecycleCallbacks(mConnectWhenActivityCreated);

        // An ActivityLifecycleMonitor is required by util.RootViews
        mActivityLifecycleMonitor = new ActivityLifecycleMonitorImpl();
        registerActivityLifecycleCallbacks(mActivityLifecycleMonitorCallbacks);
        ActivityLifecycleMonitorRegistry.registerInstance(mActivityLifecycleMonitor);
    }

}
