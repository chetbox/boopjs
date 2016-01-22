package com.chetbox.chetbot.android.util;

import android.app.Activity;
import android.os.Looper;
import android.support.test.espresso.NoActivityResumedException;
import android.support.test.espresso.Root;
import android.support.test.espresso.UiController;
import android.support.test.espresso.base.ActiveRootLister;
import android.support.test.espresso.base.RootViewPicker;
import android.support.test.espresso.base.RootViewPicker_Factory;
import android.support.test.espresso.core.deps.guava.collect.Lists;
import android.support.test.espresso.core.deps.guava.util.concurrent.Uninterruptibles;
import android.support.test.espresso.matcher.RootMatchers;
import android.support.test.runner.lifecycle.ActivityLifecycleMonitor;
import android.support.test.runner.lifecycle.ActivityLifecycleMonitorRegistry;
import android.util.Log;
import android.view.View;

import com.chetbox.chetbot.android.Container;
import com.google.common.base.Predicate;
import com.google.common.collect.Iterables;

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
        final long timeoutMillis = 10 * 1000;
        final long startedAt = System.nanoTime();
        int failCount = 0;
        Throwable lastError = new RuntimeException("Not yet run");

        while (System.nanoTime() < startedAt + timeoutMillis * 1000 * 1000) {
            final Container<Either<View, Throwable>> topmostViewContainer = new Container<>();
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        topmostViewContainer.setContent(
                                Either.<View, Throwable>left(reduceRoots(
                                        applyDefaultRootMatcher(
                                                listActiveRoots()
                                        )
                                ).getDecorView())
                        );
                    } catch (InvocationTargetException | IllegalAccessException | NoActivityResumedException e) {
                        topmostViewContainer.setContent(
                                Either.<View, Throwable>right(e)
                        );
                    }
                }
            });
            Either<View, Throwable> topmostView = topmostViewContainer.waitForContent();
            if (topmostView.isLeft()) {
                return topmostView.left();
            } else {
                failCount++;
                lastError = topmostView.right();
                Log.w(TAG, lastError.getMessage() + ", retrying...");
                Uninterruptibles.sleepUninterruptibly(100, TimeUnit.MILLISECONDS);
            }
        }
        throw new RuntimeException("Unable to get topmost window view after " + timeoutMillis + " milliseconds (" + failCount + " attempts)", lastError);
    }

    // Should be run on UI thread
    private static List<Root> listActiveRoots() throws IllegalAccessException, InvocationTargetException {
        return (List) sRootsOracle_listActiveRoots.invoke(sRootsOracle);
    }

    // Should be run on UI thread
    private static List<Root> applyDefaultRootMatcher(Iterable<Root> roots) {
        return Lists.newArrayList(
                Iterables.filter(roots, new Predicate<Root>() {
                    @Override
                    public boolean apply(Root root) {
                        return RootMatchers.DEFAULT.matches(root);
                    }
                })
        );
    }

    private static Root reduceRoots(List<Root> roots) throws IllegalAccessException, InvocationTargetException {
        return (Root) sRootViewPicker_reduceRoots.invoke(sRootViewPicker, roots);
    }

}
