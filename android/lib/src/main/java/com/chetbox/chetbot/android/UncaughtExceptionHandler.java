package com.chetbox.chetbot.android;

import java.util.ArrayList;
import java.util.List;

public final class UncaughtExceptionHandler implements Thread.UncaughtExceptionHandler {

    public interface ExceptionListener {
        void exception(Throwable e);
    }

    private static boolean sIsDefaultUncaughtExceptionHandler = false;
    private static final List<ExceptionListener> sListeners = new ArrayList<>();

    private final Thread.UncaughtExceptionHandler mExistingHandler;

    private UncaughtExceptionHandler(Thread.UncaughtExceptionHandler existingHandler) {
        this.mExistingHandler = existingHandler;
    }

    @Override
    public void uncaughtException(Thread thread, Throwable e) {
        for (ExceptionListener listener : sListeners) {
            listener.exception(e);
        }
        if (mExistingHandler != null) {
            mExistingHandler.uncaughtException(thread, e);
        }
    }

    private static void setAsDefaultUncaughtExceptionHandler() {
        if (!sIsDefaultUncaughtExceptionHandler) {
            Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler(Thread.getDefaultUncaughtExceptionHandler()));
            sIsDefaultUncaughtExceptionHandler = true;
        }
    }

    public static void addListener(ExceptionListener listener) {
        setAsDefaultUncaughtExceptionHandler();
        sListeners.add(listener);
    }

    public static void removeListener(ExceptionListener listener) {
        sListeners.remove(listener);
    }
}
