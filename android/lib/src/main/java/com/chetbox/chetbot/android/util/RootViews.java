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
import android.util.Pair;
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

    public static View getTopmostWindowView(Activity activity) {
        return reduceRoots(
                applyDefaultRootMatcher(
                        activity,
                        listActiveRoots(activity)
                )
        ).getDecorView();
    }

    private static List<Root> listActiveRoots(Activity activity) {
        final Container<List<Root>> rootsContainer = new Container<>();
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    rootsContainer.setContent( (List) sRootsOracle_listActiveRoots.invoke(sRootsOracle) );
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(e);
                } catch (InvocationTargetException e) {
                    throw new RuntimeException(e);
                }
            }
        });
        return rootsContainer.waitForContent();
    }

    private static List<Root> applyDefaultRootMatcher(Activity activity, List<Root> roots) {
        final int maxFailures = 100;
        int failCount = 0;

        ImmutableList.Builder<Root> selectedRoots = new ImmutableList.Builder<>();

        MatchRoot:
        for (final Root root : roots) {
            while (true) {
                Pair<Boolean, NoActivityResumedException> matchesContainer = applyDefaultRootMatcherOnUiThread(activity, root);

                // No error
                if (matchesContainer.first != null) {
                    if (matchesContainer.first) {
                        selectedRoots.add(root);
                    }
                    continue MatchRoot;
                }

                // Error
                if (++failCount == maxFailures) {
                    throw new NoActivityResumedException("Failed to get resumed activity after " + failCount + " attempts", matchesContainer.second);
                }
                Log.w(TAG, matchesContainer.second.getMessage() + ", retrying...");
                Uninterruptibles.sleepUninterruptibly(100, TimeUnit.MILLISECONDS);
            }
        }
        return selectedRoots.build();
    }

    private static Pair<Boolean, NoActivityResumedException> applyDefaultRootMatcherOnUiThread(Activity activity, final Root root) {
        final Container<Pair<Boolean, NoActivityResumedException>> matchesContainer = new Container<>();
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    matchesContainer.setContent(new Pair<Boolean, NoActivityResumedException>(
                            RootMatchers.DEFAULT.matches(root),
                            null
                    ));
                } catch (NoActivityResumedException error) {
                    matchesContainer.setContent(new Pair<Boolean, NoActivityResumedException>(
                            null,
                            error
                    ));
                }
            }
        });
        return matchesContainer.waitForContent();
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

}
