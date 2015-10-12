package com.chetbox.chetbot.android;

import android.app.Activity;
import android.support.test.espresso.core.deps.guava.collect.ObjectArrays;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.chetbox.chetbot.android.js.Version;
import com.chetbox.chetbot.android.util.Activities;
import com.chetbox.chetbot.android.util.RootViews;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;

import static com.google.common.collect.ImmutableList.copyOf;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.util.concurrent.*;

import static com.chetbox.chetbot.android.util.Views.*;
import static com.chetbox.chetbot.android.util.Activities.*;

import static com.google.common.collect.Iterables.*;

public class Chetbot implements ChetbotServerConnection.ScriptHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static final String CHETBOT_LIB_ENDPOINT = "/device/android.js";

    private static Chetbot sInstance = null;

    private final String mPackageName;
    private ChetbotServerConnection mServerConnection = null;

    private org.mozilla.javascript.Context mJsContext;
    private Scriptable mJsScope;

    private String mServer;
    private String[] mScriptsUrls = new String[]{};
    private String mUserScript = null;


    private Chetbot(Activity activity) {
        mServer = activity.getIntent().getStringExtra("chetbot.server");

        if (!TextUtils.isEmpty(mServer)) {
            mScriptsUrls = new String[]{"http://" + mServer + CHETBOT_LIB_ENDPOINT};
        }

        String extraScriptUrls = activity.getIntent().getStringExtra("chetbot.scripts");
        if (extraScriptUrls != null) {
            mScriptsUrls = ObjectArrays.concat(mScriptsUrls, extraScriptUrls.split(","), String.class);
        }

        mUserScript = activity.getIntent().getStringExtra("chetbot.exec");

        mPackageName = activity.getPackageName();
    }

    public void connect(final Activity activity) {
        String deviceId = activity.getIntent().getStringExtra("chetbot.device");
        boolean quiet = !TextUtils.isEmpty( activity.getIntent().getStringExtra("chetbot.quiet") );

        // Connect to Chetbot server
        if (!TextUtils.isEmpty(mServer) && !TextUtils.isEmpty(deviceId)) {

            Log.d(TAG, "Starting ChetBot v" + Version.VERSION + " (" + deviceId + ")");
            if (!quiet) {
                Toast.makeText(activity, "ChetBot v" + Version.VERSION, Toast.LENGTH_SHORT).show();
            }
            mServerConnection = new ChetbotServerConnection(mServer, deviceId, this);

            UncaughtExceptionHandler.addListener(new UncaughtExceptionHandler.ExceptionListener() {
                @Override
                public void exception(Throwable e) {
                    mServerConnection.onUncaughtError(e);
                }
            });
        }
    }

    private static String getStringValue(String key, ScriptableObject object, Scriptable scope) {
        Object value = object.get(key, scope);
        return (value == Scriptable.NOT_FOUND)
                ? null
                : (String) value;
    }

    private static Double getDoubleValue(String key, ScriptableObject object, Scriptable scope) {
        Object value = object.get(key, scope);
        return (value == Scriptable.NOT_FOUND)
                ? null
                : (Double) value;
    }

    private static SubViews subViewsSelector(Activity activity, Object selector, Scriptable scope) {
        if (selector instanceof String) {
            return new SubViews(activity, (String) selector, null, null);
        }

        return new SubViews(
                activity,
                getStringValue("text", (ScriptableObject) selector, scope),
                getStringValue("type", (ScriptableObject) selector, scope),
                getStringValue("id",   (ScriptableObject) selector, scope));
    }

    private static Iterable<View> selectViews(Activity activity, View srcView, Object[] args, Scriptable scope) {
        Preconditions.checkNotNull(srcView);

        if (args == null) {
            return null;
        }

        if (args.length > 0) {
            if (args[0] instanceof Object[]) {
                // Assume the first argument is the list of arguments
                return selectViews(activity, srcView, (Object[]) args[0], scope);
            } else if (args[0] instanceof Iterable) {
                // Assume the first argument is the list of arguments
                return selectViews(activity, srcView, toArray((Iterable) args[0], Object.class), scope);
            } else if (args[0] instanceof View) {
                // Get all View instances
                return filter(copyOf(args), View.class);
            }
        }

        Iterable<View> views = ImmutableList.of(srcView);
        for (Object selector : args) {
            views = subViewsSelector(activity, selector, scope).apply(views);
        }
        return views;
    }

    @Override
    public void setup() {
        final Activity activity = getActivity();
        // Set up JavaScript environment
        mJsContext = org.mozilla.javascript.Context.enter();
        mJsContext.setOptimizationLevel(-1);
        ScriptableObject scope = mJsContext.initStandardObjects();

        registerJsFunction(scope, "wait_until_idle", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                long timeout = 10;
                if (args.length > 0 && args[0] instanceof ScriptableObject) {
                    timeout = Math.round(getDoubleValue("timeout", (ScriptableObject) args[0], (ScriptableObject) args[0]));
                }
                waitUntilIdle(activity, timeout, TimeUnit.SECONDS);
                return null;
            }
        });

        mJsContext.evaluateString(scope, "RegExp; getClass; java; Packages; JavaAdapter;", "<lazy_load>", 1, null);
        mJsContext.evaluateString(scope, "var package_name = '" + mPackageName + "';", "<package_name>", 1, null);
        scope.sealObject();

        mJsScope = mJsContext.newObject(scope);
        mJsScope.setPrototype(scope);
        mJsScope.setParentScope(null);

        OkHttpClient client = new OkHttpClient();
        try {
            for (final String scriptUrl : mScriptsUrls) {
                Log.d(TAG, "Loading " + scriptUrl);
                Request request = new Request.Builder()
                        .url(scriptUrl)
                        .build();
                Response response = client.newCall(request).execute();
                if (!response.isSuccessful()) {
                    throw new RuntimeException("HTTP Error " + response.code() + ": " + response.message());
                }
                String script = response.body().string();

                onStatement(new ChetbotServerConnection.Statement(script, 1), scriptUrl);
                Log.d(TAG, "Loaded " + scriptUrl);
            }
            if (mUserScript != null) {
                onStatement(new ChetbotServerConnection.Statement(mUserScript, 1), "<user>");
            }
        } catch (final Exception e) {
            Log.e(TAG, e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(activity, e.getClass().getSimpleName() + ": " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
            if (mServerConnection != null) {
                mServerConnection.onUncaughtError(e);
            }
        }
    }

    @Override
    public void onStartScript() {}

    @Override
    public Object onStatement(ChetbotServerConnection.Statement stmt, String scriptName) {
        return mJsContext.evaluateString(mJsScope, stmt.getSource(), scriptName, stmt.getLine(), null);
    }

    @Override
    public void onFinishScript() {}

    private interface JsFunction {
        Object call(Activity activity, Object[] args);
    }

    private interface JsViewFunction {
        Object call(Activity activity, Iterable<View> selectedViews);
    }

    private void registerJsFunction(Scriptable scope, String name, final JsFunction fn) {
        scope.put(name, scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, final Object[] args) {
                return fn.call(getActivity(), args);
            }
        });
    }

    private void registerJsFunction(Scriptable scope, String name, final JsViewFunction fn) {
        scope.put(name, scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                final Activity activity = getActivity();
                final View rootView = RootViews.getTopmostContentView(activity);
                final Iterable<View> selectedViews = selectViews(activity, rootView, args, scope);
                return fn.call(activity, selectedViews);
            }
        });
    }

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

    private Activity getActivity() {
        return Activities.getActivity(mPackageName);
    }

}
