package com.chetbox.chetbot.android.util;

import android.support.test.espresso.core.deps.guava.base.Joiner;
import android.util.Log;

import com.chetbox.chetbot.android.Chetbot;
import com.google.gson.annotations.SerializedName;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.Wrapper;

import javax.inject.Provider;

public class Logs {

    public enum Level {
        @SerializedName("debug") DEBUG,
        @SerializedName("info") INFO,
        @SerializedName("warn") WARN,
        @SerializedName("error") ERROR
    }

    public static int androidLogLevel(Level level) {
        switch (level) {
            case DEBUG: return Log.DEBUG;
            case INFO: return Log.INFO;
            case WARN: return Log.WARN;
            case ERROR: return Log.ERROR;
            default: return Log.DEBUG;
        }
    }

    public interface LogMessageHandler {
        void onLogMessage(Level level, Object data);
    }

    public static class LogCallable implements Callable {

        private final Provider<LogMessageHandler> mLogMessageHandler;
        private final Level mLogLevel;

        public LogCallable(Provider<LogMessageHandler> logMessageHandler, Level logLevel) {
            mLogMessageHandler = logMessageHandler;
            mLogLevel = logLevel;
        }

        @Override
        public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
            Log.println(androidLogLevel(mLogLevel), Chetbot.TAG, Joiner.on(", ").join(args));
            for (Object arg : args) {
                if (arg instanceof Wrapper) {
                    arg = ((Wrapper) arg).unwrap();
                }
                LogMessageHandler logHandler = mLogMessageHandler.get();
                if (logHandler != null) {
                    logHandler.onLogMessage(mLogLevel, arg);
                }
            }
            return Undefined.instance;
        }

    }

}
