package com.chetbox.chetbot.android;

import android.app.Activity;
import android.os.Bundle;
import android.support.multidex.MultiDexApplication;

public class ChetbotApplication extends MultiDexApplication {

    private final ActivityLifecycleCallbacks CONNECT_WHEN_ACTIVITY_CREATED = new ActivityLifecycleCallbacks() {
        @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
            Chetbot.getInstance(activity).connect(activity);
            unregisterActivityLifecycleCallbacks(CONNECT_WHEN_ACTIVITY_CREATED);
        }

        @Override public void onActivityStarted(Activity activity) {}
        @Override public void onActivityResumed(Activity activity) {}
        @Override public void onActivityPaused(Activity activity) {}
        @Override public void onActivityStopped(Activity activity) {}
        @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) {}
        @Override public void onActivityDestroyed(Activity activity) {}
    };

    @Override
    public void onCreate() {
        super.onCreate();
        registerActivityLifecycleCallbacks(CONNECT_WHEN_ACTIVITY_CREATED);
    }

}
