package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.support.test.espresso.core.deps.guava.collect.Iterables;
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
import com.chetbox.chetbot.android.util.Activities;
import com.chetbox.chetbot.android.util.InputEvents;
import com.chetbox.chetbot.android.util.RootViews;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;

import static com.google.common.collect.ImmutableList.copyOf;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import static com.chetbox.chetbot.android.util.Views.*;
import static com.chetbox.chetbot.android.util.Activities.*;

import static com.google.common.collect.Iterables.*;

public class Chetbot implements ChetbotServerConnection.ScriptHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static Chetbot sInstance = null;

    /* For testing only */
    private static Activity sTestActivity = null;

    private final String mPackageName;
    private ChetbotServerConnection mServerConnection = null;

    private org.mozilla.javascript.Context mJsContext;
    private Scriptable mJsScope;

    private Chetbot(Context context) {
        if (context != null) {
            mPackageName = context.getPackageName();
        } else {
            // Running in testing mode
            mPackageName = null;
        }
    }

    public void connect(Activity activity) {
        String server = activity.getIntent().getStringExtra("chetbot.server");
        String deviceId = activity.getIntent().getStringExtra("chetbot.device");
        boolean quiet = !TextUtils.isEmpty( activity.getIntent().getStringExtra("chetbot.quiet") );

        // Connect to Chetbot server
        if (!TextUtils.isEmpty(server) && !TextUtils.isEmpty(deviceId)) {
            Log.d(TAG, "Starting ChetBot (" + deviceId + ")");
            if (!quiet) {
                Toast.makeText(activity, "Starting ChetBot", Toast.LENGTH_SHORT).show();
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

    private static SubViews subViewsSelector(Object selector, Scriptable scope) {
        if (selector instanceof String) {
            return new SubViews((String) selector, null, null);
        }

        return new SubViews(
                getStringValue("text", (ScriptableObject) selector, scope),
                getStringValue("type", (ScriptableObject) selector, scope),
                getStringValue("id",   (ScriptableObject) selector, scope));
    }

    private static Iterable<View> selectViews(View srcView, Object[] args, Scriptable scope) {
        Preconditions.checkNotNull(srcView);

        if (args == null) {
            return null;
        }

        if (args.length > 0) {
            if (args[0] instanceof Object[]) {
                // Assume the first argument is the list of arguments
                return selectViews(srcView, (Object[]) args[0], scope);
            } else if (args[0] instanceof Iterable) {
                // Assume the first argument is the list of arguments
                return selectViews(srcView, toArray((Iterable) args[0], Object.class), scope);
            } else if (args[0] instanceof View) {
                // Get all View instances
                return filter(copyOf(args), View.class);
            }
        }

        Iterable<View> views = ImmutableList.of(srcView);
        for (Object selector : args) {
            views = subViewsSelector(selector, scope).apply(views);
        }
        return views;
    }

    public void onStartScript() {
        // Set up JavaScript environment
        mJsContext = org.mozilla.javascript.Context.enter();
        mJsContext.setOptimizationLevel(-1);
        ScriptableObject scope = mJsContext.initStandardObjects();

        registerJsFunction(scope, "view_id", new JsViewFunction() {
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
        registerJsFunction(scope, "class_of", new JsViewFunction() {
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
        registerJsFunction(scope, "exists", new JsViewFunction() {
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
        registerJsFunction(scope, "screenshot", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                return screenshot(activity);
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
        registerJsFunction(scope, "hide_keyboard", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                InputMethodManager imm = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(RootViews.getTopmostContentView(activity).getWindowToken(), 0);
                sleep(0.25);
                return null;
            }
        });
        registerJsFunction(scope, "home", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(homeIntent);
                sleep(0.5);
                return null;
            }
        });
        registerJsFunction(scope, "press", new JsFunction() {
            @Override
            public Object call(final Activity activity, Object[] args) {
                int _keycode;
                String keyArg = (String) args[0];
                if ("enter".equalsIgnoreCase(keyArg)
                        || "return".equalsIgnoreCase(keyArg)
                        || "\n".equals(keyArg)) {
                    _keycode = KeyEvent.KEYCODE_ENTER;
                } else if ("back".equalsIgnoreCase(keyArg)) {
                    // TODO: hide keyboard instead if keyboard is showing
                    _keycode = KeyEvent.KEYCODE_BACK;
                } else if ("backspace".equalsIgnoreCase(keyArg)
                        || "\b".equals(keyArg)) {
                    _keycode = KeyEvent.KEYCODE_DEL;
                } else {
                    throw new IllegalArgumentException("Unrecognised key: " + args[0]);
                }
                final int keycode = _keycode;
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, keycode));
                        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, keycode));
                    }
                });
                sleep(0.25);
                return null;
            }
        });

        registerJsFunction(scope, "type_text", new JsFunction() {
            @Override
            public Object call(final Activity activity, Object[] args) {
                final String text = (String) args[0];
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.dispatchKeyEvent(
                                new KeyEvent(SystemClock.uptimeMillis(), text, 0, 0)
                        );
                    }
                });
                sleep(0.25);
                return null;
            }
        });
        registerJsFunction(scope, "activity", new JsFunction() {
            @Override
            public Object call(final Activity activity, Object[] args) {
                return activity;
            }
        });
        registerJsFunction(scope, "toast", new JsFunction() {
            @Override
            public Object call(final Activity activity, final Object[] args) {
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(activity, (String) args[0], Toast.LENGTH_SHORT).show();
                    }
                });
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
                View rootView = RootViews.getTopmostContentView(getActivity());
                View target = firstView(selectViews(rootView, new Object[]{args[0]}, scope));
                Iterable<View> views = selectViews(rootView, new Object[]{args[1]}, scope);
                return new EuclidianDistanceOrdering(center(target)).min(views);
            }
        });
        scope.put("furthest_from", scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                View rootView = RootViews.getTopmostContentView(getActivity());
                View target = firstView(selectViews(rootView, new Object[]{args[0]}, scope));
                Iterable<View> views = selectViews(rootView, new Object[]{args[1]}, scope);
                return new EuclidianDistanceOrdering(center(target)).max(views);
            }
        });
        scope.put("wait", scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                sleep((Double) args[0]);
                return null;
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
        registerJsFunction(scope, "crash", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        throw new RuntimeException("forced crash");
                    }
                });
                return null;
            }
        });

        mJsContext.evaluateString(scope, "RegExp; getClass; java; Packages; JavaAdapter;", "<lazyLoad>", 0, null);
        mJsContext.evaluateString(scope, Version.source(), Version.class.getName(), 0, null);
        mJsContext.evaluateString(scope, Assert.source(), Assert.class.getName(), 0, null);
        mJsContext.evaluateString(scope, Drawers.source(), Drawers.class.getName(), 0, null);
        scope.sealObject();

        mJsScope = mJsContext.newObject(scope);
        mJsScope.setPrototype(scope);
        mJsScope.setParentScope(null);
    }

    @Override
    public Object onStatement(ChetbotServerConnection.Statement stmt, String scriptName) {
        return mJsContext.evaluateString(mJsScope, stmt.getSource(), scriptName, stmt.getLine(), null);
    }

    @Override
    public void onFinishScript() {
        org.mozilla.javascript.Context.exit();
        mJsContext = null;
    }

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
                final Iterable<View> selectedViews = selectViews(rootView, args, scope);
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
