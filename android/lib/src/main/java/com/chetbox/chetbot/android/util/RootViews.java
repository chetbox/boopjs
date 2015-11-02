package com.chetbox.chetbot.android.util;

import android.app.Activity;
import android.os.Looper;
import android.support.test.espresso.NoActivityResumedException;
import android.support.test.espresso.Root;
import android.support.test.espresso.UiController;
import android.support.test.espresso.base.ActiveRootLister;
import android.support.test.espresso.base.RootViewPicker;
import android.support.test.espresso.base.RootViewPicker_Factory;
import android.support.test.espresso.core.deps.guava.util.concurrent.Uninterruptibles;
import android.support.test.espresso.matcher.RootMatchers;
import android.support.test.runner.lifecycle.ActivityLifecycleMonitor;
import android.support.test.runner.lifecycle.ActivityLifecycleMonitorRegistry;
import android.util.Log;
import android.view.View;

import com.chetbox.chetbot.android.Container;
import com.google.common.collect.ImmutableList;

import org.hamcrest.Matcher;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import javax.inject.Provider;

/**
 * Use Espresso to find and access root views
 */
public class RootViews {

    private static final String TAG = RootViews.class.getSimpleName();

    private static final ActiveRootLister sRootsOracle;
    private static final Method sRootsOracle_listActiveRoots;

    private static final RootViewPicker sRootViewPicker;
    private static final Method sRootViewPicker_reduceRoots;

    static {
        try {
            Class rootsOracleClass = Class.forName("android.support.test.espresso.base.RootsOracle");
            Constructor<ActiveRootLister> rootsOracleConstructor = rootsOracleClass.getDeclaredConstructor(new Class[]{Looper.class});
            rootsOracleConstructor.setAccessible(true);
            sRootsOracle = rootsOracleConstructor.newInstance(Looper.getMainLooper());

            sRootsOracle_listActiveRoots = rootsOracleClass.getMethod("listActiveRoots");

            sRootViewPicker = RootViewPicker_Factory.create(
                    new Provider<ActiveRootLister>() {
                        @Override public ActiveRootLister get() { return null; }
                    },
                    new Provider<UiController>() {
                        @Override public UiController get() { return null; }
                    },
                    new Provider<ActivityLifecycleMonitor>() {
                        @Override public ActivityLifecycleMonitor get() { return ActivityLifecycleMonitorRegistry.getInstance(); }
                    },
                    new Provider<AtomicReference<Matcher<Root>>>() {
                        @Override public AtomicReference<Matcher<Root>> get() { return new AtomicReference<>(RootMatchers.DEFAULT); }
                    }).get();

            sRootViewPicker_reduceRoots = RootViewPicker.class.getDeclaredMethod("reduceRoots", List.class);
            sRootViewPicker_reduceRoots.setAccessible(true);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private RootViews() {}

    public static View getTopmostContentView(Activity activity) {
        final Container<View> rootView = new Container<>();
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                rootView.setContent(reduceRoots(applyDefaultRootMatcher(listActiveRoots())).getDecorView());
            }
        });
        return findContentView(rootView.waitForContent());
    }

    // Must be run on UI thread
    private static List<Root> listActiveRoots() {
        try {
            return (List) sRootsOracle_listActiveRoots.invoke(sRootsOracle);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        } catch (InvocationTargetException e) {
            throw new RuntimeException(e);
        }
    }

    private static List<Root> applyDefaultRootMatcher(List<Root> roots) {
        final int maxTries = 5;
        int tryCount = 0;
        while (true) {
            try {
                return _applyDefaultRootMatcher(roots);
            } catch (NoActivityResumedException e) {
                if (++tryCount == maxTries) {
                    throw new RuntimeException("Failed to get resumed activity after " + tryCount + " attempts", e);
                }
                Log.w(TAG, e.getMessage() + ", retrying...");
            }
            Uninterruptibles.sleepUninterruptibly(50, TimeUnit.MILLISECONDS);
        }
    }

    private static List<Root> _applyDefaultRootMatcher(List<Root> roots) throws NoActivityResumedException {
        ImmutableList.Builder<Root> selectedRoots = new ImmutableList.Builder<>();
        for (Root root : roots) {
            if (RootMatchers.DEFAULT.matches(root)) {
                selectedRoots.add(root);
            }
        }
        return selectedRoots.build();
    }

    private static Root reduceRoots(List<Root> roots) {
        try {
            return (Root) sRootViewPicker_reduceRoots.invoke(sRootViewPicker, roots);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        } catch (InvocationTargetException e) {
            throw new RuntimeException(e);
        }
    }

    private static View findContentView(View rootView) {
        View contentView = rootView.findViewById(android.R.id.content);
        return (contentView != null)
                ? contentView
                : rootView; // Probably some kind of popup (e.g. dropdown menu)
    }

}
