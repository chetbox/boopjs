package com.chetbox.chetbot.android.util;

import android.view.MotionEvent;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * Inject input events into the view hierarchy
 */
public class InputEvents {

    private static final Object sInputManagerEventInjectionStrategy;
    private static final Method sInputManagerEventInjectionStrategy_injectMotionEvent;

    static {
        try {
            Class inputManagerEventInjectionStrategyClass = Class.forName("android.support.test.espresso.base.InputManagerEventInjectionStrategy");
            Constructor inputManagerEventInjectionStrategyConstructor = inputManagerEventInjectionStrategyClass.getDeclaredConstructor(new Class[]{});
            inputManagerEventInjectionStrategyConstructor.setAccessible(true);
            Method initialize = inputManagerEventInjectionStrategyClass.getDeclaredMethod("initialize");
            initialize.setAccessible(true);
            sInputManagerEventInjectionStrategy_injectMotionEvent = inputManagerEventInjectionStrategyClass.getMethod("injectMotionEvent", MotionEvent.class);
            sInputManagerEventInjectionStrategy = inputManagerEventInjectionStrategyConstructor.newInstance();
            initialize.invoke(sInputManagerEventInjectionStrategy);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static void injectEvent(MotionEvent event) {
        try {
            sInputManagerEventInjectionStrategy_injectMotionEvent.invoke(sInputManagerEventInjectionStrategy, event);

        } catch (InvocationTargetException e) {
            throw new RuntimeException(e);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }
}
