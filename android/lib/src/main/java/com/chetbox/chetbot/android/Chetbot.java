package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;
import android.widget.Toast;

import com.chetbox.chetbot.android.js.Assert;
import com.chetbox.chetbot.android.js.Drawers;
import com.chetbox.chetbot.android.js.Version;
import com.chetbox.chetbot.android.js.Wait;
import com.chetbox.chetbot.android.util.Activities;
import com.chetbox.chetbot.android.util.InputEvents;
import com.chetbox.chetbot.android.util.RootViews;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;

import static com.google.common.collect.ImmutableList.copyOf;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.concurrent.*;

import static com.chetbox.chetbot.android.util.Views.*;
import static com.chetbox.chetbot.android.util.Activities.*;

import static com.google.common.collect.Iterables.*;

public class Chetbot implements ChetbotServerConnection.ScriptHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static final String CHETBOT_LIB_ENDPOINT = "/device/android.js";

    private static Chetbot sInstance = null;

    /* For testing only */
    private static Activity sTestActivity = null;

    private final String mPackageName;
    private ChetbotServerConnection mServerConnection = null;

    private org.mozilla.javascript.Context mJsContext;
    private Scriptable mJsScope;

    private Collection<String> mScripts;


    private Chetbot(Context context) {
        if (context != null) {
            mPackageName = context.getPackageName();
        } else {
            // Running in testing mode
            mPackageName = null;
        }
    }

    public void connect(final Activity activity) {
        String server = activity.getIntent().getStringExtra("chetbot.server");
        String deviceId = activity.getIntent().getStringExtra("chetbot.device");
        boolean quiet = !TextUtils.isEmpty( activity.getIntent().getStringExtra("chetbot.quiet") );
        String scriptUrls = activity.getIntent().getStringExtra("chetbot.scripts");

        // Connect to Chetbot server
        if (!TextUtils.isEmpty(server) && !TextUtils.isEmpty(deviceId)) {
            mScripts = new ImmutableList.Builder<String>()
                    .add("http://" + server +  CHETBOT_LIB_ENDPOINT)
                    .addAll(Arrays.asList((scriptUrls.split(","))))
                    .build();

            Log.d(TAG, "Starting ChetBot v" + Version.VERSION + " (" + deviceId + ")");
            if (!quiet) {
                Toast.makeText(activity, "ChetBot v" + Version.VERSION, Toast.LENGTH_SHORT).show();
            }
            mServerConnection = new ChetbotServerConnection(server, deviceId, this);

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

        registerJsFunction(scope, "id", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                View v = firstView(selectedViews);
                int id = v.getId();
                return id != -1
                        ? v.getResources().getResourceName(id)
                        : null;
            }
        });
        registerJsFunction(scope, "view_ids", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return toArray(ViewIds.apply(concat(transform(selectedViews, ChildViews))), String.class);
            }
        });
        registerJsFunction(scope, "type", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return firstView(selectedViews).getClass().getSimpleName();
            }
        });
        registerJsFunction(scope, "count", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return size(selectedViews);
            }
        });
        registerJsFunction(scope, "visible", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return !isEmpty(selectedViews);
            }
        });
        registerJsFunction(scope, "text", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return ((TextView) firstView(selectedViews)).getText().toString();
            }
        });
        registerJsFunction(scope, "location", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return location(firstView(selectedViews));
            }
        });
        registerJsFunction(scope, "center", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return center(firstView(selectedViews));
            }
        });
        registerJsFunction(scope, "size", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return size(firstView(selectedViews));
            }
        });
        registerJsFunction(scope, "tap", new JsViewFunction() {
            @Override
            public Object call(final Activity activity, Iterable<View> selectedViews) {
                View view = firstView(selectedViews);
                final int[] viewCenter = center(view);
                final long timestamp = SystemClock.uptimeMillis();
                final MotionEvent downEvent = MotionEvent.obtain(
                        timestamp,
                        timestamp,
                        MotionEvent.ACTION_DOWN,
                        viewCenter[0],
                        viewCenter[1],
                        0);
                final MotionEvent upEvent = MotionEvent.obtain(
                        timestamp,
                        timestamp + 20,
                        MotionEvent.ACTION_UP,
                        viewCenter[0],
                        viewCenter[1],
                        0);

                InputEvents.injectEvent(downEvent);
                InputEvents.injectEvent(upEvent);

                sleep(0.25);
                return null;
            }
        });
        registerJsFunction(scope, "views", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return Iterables.toArray(selectedViews, View.class);
            }
        });
        registerJsFunction(scope, "view", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return firstView(selectedViews);
            }
        });
        registerJsFunction(scope, "leftmost", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return horizontalOrdering.min(selectedViews);
            }
        });
        registerJsFunction(scope, "rightmost", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return horizontalOrdering.max(selectedViews);
            }
        });
        registerJsFunction(scope, "topmost", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return verticalOrdering.min(selectedViews);
            }
        });
        registerJsFunction(scope, "bottommost", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return verticalOrdering.max(selectedViews);
            }
        });
        registerJsFunction(scope, "centermost", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return new EuclidianDistanceOrdering(center(screenSize(activity))).min(selectedViews);
            }
        });
        registerJsFunction(scope, "outermost", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return new EuclidianDistanceOrdering(center(screenSize(activity))).max(selectedViews);
            }
        });
        scope.put("closest_to", scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                Activity activity = getActivity();
                View rootView = RootViews.getTopmostContentView(activity);
                View target = firstView(selectViews(activity, rootView, new Object[]{args[0]}, scope));
                Iterable<View> views = selectViews(activity, rootView, new Object[]{args[1]}, scope);
                return new EuclidianDistanceOrdering(center(target)).min(views);
            }
        });
        scope.put("furthest_from", scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                Activity activity = getActivity();
                View rootView = RootViews.getTopmostContentView(activity);
                View target = firstView(selectViews(activity, rootView, new Object[]{args[0]}, scope));
                Iterable<View> views = selectViews(activity, rootView, new Object[]{args[1]}, scope);
                return new EuclidianDistanceOrdering(center(target)).max(views);
            }
        });
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
        if (mScripts != null) {
            for (final String scriptUrl : mScripts) {
                try {
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

                } catch (final Exception e) {
                    Log.w(TAG, "Error loading script '" + scriptUrl + "': " + e.getMessage());
                    e.printStackTrace();
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(activity, scriptUrl + "\n" + e.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    });
                    if (mServerConnection != null) {
                        mServerConnection.onUncaughtError(e);
                    }
                }
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
        }
        sTestActivity = null;
        sInstance = null;
    }

    public static Chetbot getInstance(Context context) {
        if (sInstance == null) {
            sInstance = new Chetbot(context);
        }
        return sInstance;
    }

    public void setTestActivity(Activity activity) {
        sTestActivity = activity;
    }

    // based on https://androidreclib.wordpress.com/2014/11/22/getting-the-current-activity/
    private Activity getActivity() {
        if (sTestActivity != null) {
            return sTestActivity;
        }

        return Activities.getActivity(mPackageName);
    }

}
