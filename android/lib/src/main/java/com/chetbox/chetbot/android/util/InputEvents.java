package com.chetbox.chetbot.android.util;

import android.view.KeyEvent;
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
    private static final Method sInputManagerEventInjectionStrategy_injectKeyEvent;

    static {
        try {
            Class inputManagerEventInjectionStrategyClass = Class.forName("android.support.test.espresso.base.InputManagerEventInjectionStrategy");
            Constructor inputManagerEventInjectionStrategyConstructor = inputManagerEventInjectionStrategyClass.getDeclaredConstructor(new Class[]{});
            inputManagerEventInjectionStrategyConstructor.setAccessible(true);
            Method initialize = inputManagerEventInjectionStrategyClass.getDeclaredMethod("initialize");
            initialize.setAccessible(true);
            sInputManagerEventInjectionStrategy_injectMotionEvent = inputManagerEventInjectionStrategyClass.getMethod("injectMotionEvent", MotionEvent.class);
            sInputManagerEventInjectionStrategy_injectKeyEvent = inputManagerEventInjectionStrategyClass.getMethod("injectKeyEvent", KeyEvent.class);
            sInputManagerEventInjectionStrategy = inputManagerEventInjectionStrategyConstructor.newInstance();
            initialize.invoke(sInputManagerEventInjectionStrategy);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static boolean injectMotionEvent(MotionEvent event) {
        try {
            return (Boolean) sInputManagerEventInjectionStrategy_injectMotionEvent.invoke(sInputManagerEventInjectionStrategy, event);
        } catch (InvocationTargetException e) {
            throw new RuntimeException(e.getCause());
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    public static boolean injectKeyEvent(KeyEvent event) {
        try {
            return (Boolean) sInputManagerEventInjectionStrategy_injectKeyEvent.invoke(sInputManagerEventInjectionStrategy, event);
        } catch (InvocationTargetException e) {
            throw new RuntimeException(e.getCause());
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

}
