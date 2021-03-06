package com.chetbox.chetbot.android;

import android.app.Activity;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.widget.Toast;

import com.chetbox.chetbot.android.util.Activities;
import com.chetbox.chetbot.android.util.InputEvents;
import com.chetbox.chetbot.android.util.Logs;
import com.chetbox.chetbot.android.util.Rhino;
import com.chetbox.chetbot.android.util.RootViews;
import com.google.gson.JsonSyntaxException;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.io.IOException;

import javax.inject.Provider;

public class Chetbot implements ChetbotServerConnection.ScriptHandler, Provider<Logs.LogMessageHandler> {

    public static final String TAG = Chetbot.class.getSimpleName();
    private static final OkHttpClient HTTP_CLIENT = new OkHttpClient();

    private static Chetbot sInstance = null;

    private final String mPackageName;
    private ChetbotServerConnection mServerConnection = null;

    private org.mozilla.javascript.Context mJsContext;
    private ScriptableObject mJsScope;

    private String mServerWsUrl;
    private String[] mScriptsUrls = new String[]{};
    private String mUserScript = null;


    private Chetbot(Activity activity) {
        String scriptUrls = activity.getIntent().getStringExtra("boop.scripts");
        if (scriptUrls != null) {
            try {
                mScriptsUrls = Rhino.GSON.fromJson(scriptUrls, String[].class);
            } catch (JsonSyntaxException e) {
                e.printStackTrace();
                Toast.makeText(activity, e.toString(), Toast.LENGTH_LONG).show();
            }
        }

        mServerWsUrl = activity.getIntent().getStringExtra("boop.server");
        mUserScript = activity.getIntent().getStringExtra("boop.exec");
        mPackageName = activity.getPackageName();
    }

    public void connect(final Activity activity) {
        boolean quiet = !TextUtils.isEmpty( activity.getIntent().getStringExtra("boop.quiet") );

        // Connect to Chetbot server
        if (!TextUtils.isEmpty(mServerWsUrl)) {
            Log.d(TAG, "Starting boop.js (" + mServerWsUrl + ")");
            if (!quiet) {
                Toast.makeText(activity, "Starting boop.js", Toast.LENGTH_SHORT).show();
            }
            mServerConnection = new ChetbotServerConnection(mServerWsUrl, this);

            UncaughtExceptionHandler.addListener(new UncaughtExceptionHandler.ExceptionListener() {
                @Override
                public void exception(Throwable e) {
                    mServerConnection.onUncaughtError(e);
                }
            });
        }
    }

    @Override
    public void setup() {
        // Set up JavaScript environment
        mJsContext = org.mozilla.javascript.Context.enter();
        mJsContext.setOptimizationLevel(-1);
        mJsScope = mJsContext.initStandardObjects();

        mJsContext.evaluateString(mJsScope, "RegExp; getClass; java; Packages; JavaAdapter;", "<lazy_load>", 1, null);
        mJsContext.evaluateString(mJsScope, "var package_name = '" + mPackageName + "';", "<package_name>", 1, null);

        // All functions that require calling and dependent libraries should go here
        // because we change the namespace of this library and its dependencies in production
        mJsScope.put("inject_motion_event", mJsScope, new Callable() {
            @Override
            public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
                for (Object arg : args) {
                    boolean success = InputEvents.injectMotionEvent((MotionEvent) Rhino.unwrapJavaObject(arg));
                    if (!success) return false;
                }
                return true;
            }
        });
        mJsScope.put("inject_key_event", mJsScope, new Callable() {
            @Override
            public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
                for (Object arg : args) {
                    boolean success = InputEvents.injectKeyEvent((KeyEvent) Rhino.unwrapJavaObject(arg));
                    if (!success) return false;
                }
                return true;
            }
        });
        mJsScope.put("content_view", mJsScope, new Callable() {
            @Override
            public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
                Object contentView = RootViews.getTopmostWindowView(Activities.getActivity(mPackageName));
                return Rhino.wrapJavaObject(contentView, mJsContext, scope);
            }
        });
        mJsScope.put("activity", mJsScope, new Callable() {
            @Override
            public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
                return Rhino.wrapJavaObject(Activities.getActivity(mPackageName), mJsContext, scope);
            }
        });
        {
            Scriptable console = mJsContext.newObject(mJsScope);
            console.put("log", console, new Logs.LogCallable(this, Logs.Level.DEBUG));
            console.put("info", console, new Logs.LogCallable(this, Logs.Level.INFO));
            console.put("warn", console, new Logs.LogCallable(this, Logs.Level.WARN));
            console.put("error", console, new Logs.LogCallable(this, Logs.Level.ERROR));
            mJsScope.put("console", mJsScope, console);
        }

        mJsScope = sealJsScope(mJsContext, mJsScope);

        try {
            for (final String scriptUrl : mScriptsUrls) {
                String script = getTextFromUrl(scriptUrl);
                mJsContext.evaluateString(mJsScope, script, scriptUrl, 1, null);
            }
            if (mUserScript != null) {
                mJsContext.evaluateString(mJsScope, mUserScript, "<user>", 1, null);
            }
        } catch (Throwable t) {
            handleScriptError(t);
        } finally {
            mJsScope = sealJsScope(mJsContext, mJsScope);
        }
    }

    private static ScriptableObject sealJsScope(Context jsContext, ScriptableObject oldScope) {
        oldScope.sealObject();
        ScriptableObject newScope = (ScriptableObject) jsContext.newObject(oldScope);
        newScope.setPrototype(oldScope);
        newScope.setParentScope(null);
        return newScope;
    }

    private String getTextFromUrl(String scriptUrl) throws IOException {
        Log.d(TAG, "Loading " + scriptUrl);
        Request request = new Request.Builder()
                .url(scriptUrl)
                .build();
        Response response = HTTP_CLIENT.newCall(request).execute();
        if (!response.isSuccessful()) {
            throw new RuntimeException("HTTP Error " + response.code() + ": " + response.message());
        }
        return response.body().string();
    }

    private void handleScriptError(final Throwable t) {
        Log.e(TAG, t.getClass().getSimpleName() + ": " + t.getMessage());
        t.printStackTrace();
        final Activity activity = Activities.getActivity(mPackageName);
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(activity, t.getClass().getSimpleName() + ": " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
        if (mServerConnection != null) {
            mServerConnection.onUncaughtError(t);
        } else {
            throw new RuntimeException(t);
        }
    }

    @Override
    public void onStartScript() {}

    @Override
    public Object onStatement(ChetbotServerConnection.Statement stmt, String scriptName) {
        return Rhino.unwrapJavaObject(mJsContext.evaluateString(mJsScope, stmt.getSource(), scriptName, stmt.getLine(), null));
    }

    @Override
    public void onFinishScript() {}

    public static void reset() {
        if (sInstance != null) {
            if (sInstance.mServerConnection != null) {
                sInstance.mServerConnection.close();
            }
            if (sInstance.mJsContext != null) {
                sInstance.mJsContext = null;
                sInstance.mJsScope = null;
                org.mozilla.javascript.Context.exit();
            }
        }
        sInstance = null;
    }

    public static Chetbot getInstance(Activity activity) {
        if (sInstance == null) {
            sInstance = new Chetbot(activity);
        }
        return sInstance;
    }

    @Override
    public ChetbotServerConnection get() {
        return mServerConnection;
    }

}
