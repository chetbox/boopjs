package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Context;
import android.util.ArrayMap;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import java.lang.reflect.Field;

import static com.chetbox.chetbot.android.ViewUtils.*;

import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.*;

public class Chetbot implements ChetbotServerConnection.MessageHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static Chetbot sInstance = null;

    private final String mPackageName;
    private final ChetbotServerConnection mServerConnection;

    private Chetbot(Context context) {
        mPackageName = context.getPackageName();

        // Connect to Chetbot server
        mServerConnection = new ChetbotServerConnection(this);
        mServerConnection.connect();
    }

    private static SubViews subViewsSelector(Command cmd) {
        return new SubViews(cmd.getText(), cmd.getType(), cmd.getId());
    }

    private Iterable<?> performAction(Command cmd, Activity activity, Iterable<?> lastResults) throws IllegalArgumentException {
        switch (cmd.getName()) {
            case VIEW:
                return concat(transform(asViews(lastResults), subViewsSelector(cmd)));
            case ID: {
                View v = firstView(lastResults);
                String idStr = v.getResources().getResourceName(v.getId());
                idStr = idStr.substring(idStr.lastIndexOf("/") + 1);
                return newArrayList( idStr );
            }
            case TYPE: {
                return newArrayList( firstView(lastResults).getClass().getSimpleName() );
            }
            case COUNT:
                return newArrayList( size(lastResults) );
            case EXISTS:
                return newArrayList( !isEmpty(lastResults) );
            case TEXT:
                if (!isEmpty(lastResults)) {
                    TextView tv = ((TextView) firstView(lastResults));
                    return newArrayList( tv.getText().toString() );
                }
            case LOCATION:
                return newArrayList( location(firstView(lastResults)) );
            case CENTER:
                return newArrayList( location(firstView(lastResults)) );
            case SIZE:
                return newArrayList( size(firstView(lastResults)) );
            case LEFTMOST:
                return newArrayList( horizontalOrdering.min(asViews(lastResults)) );
            case RIGHTMOST:
                return newArrayList( horizontalOrdering.max(asViews(lastResults)) );
            case TOPMOST:
                return newArrayList( verticalOrdering.min(asViews(lastResults)) );
            case BOTTOMMOST:
                return newArrayList( verticalOrdering.max(asViews(lastResults)) );
            case CLOSEST_TO: {
                View target = firstView(subViewsSelector(cmd).apply(getRootView(getActivity())));
                return newArrayList(new EuclidianDistanceOrdering(center(target)).min(asViews(lastResults)));
            }
            case FURTHEST_FROM: {
                View target = firstView(subViewsSelector(cmd).apply(getRootView(getActivity())));
                return newArrayList(new EuclidianDistanceOrdering(center(target)).max(asViews(lastResults)));
            }
            case TAP: {
                final View view = firstView(lastResults);
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        view.callOnClick();
                    }
                });
                return lastResults;
            }
            default:
                throw new IllegalArgumentException("Invalid command: " + cmd);
        }
    }

    public Object onMessage(Command[] commands) throws IllegalArgumentException {
        if (commands.length == 0) {
            throw new IllegalArgumentException("No commands given");
        }

        Activity activity = getActivity();
        Iterable<?> results = newArrayList(getRootView(activity));
        for (Command cmd : commands) {
            results = performAction(cmd, activity, results);
        }

        Object result = isEmpty(results) ? null : get(results, 0);
        if (result instanceof String
                || result instanceof Integer
                || result instanceof Long
                || result instanceof Float
                || result instanceof Double
                || result instanceof Boolean
                || result instanceof String[]
                || result instanceof int[]
                || result instanceof float[]
                || result instanceof float[]
                || result instanceof long[]
                || result instanceof double[]
                || result instanceof boolean[]) {

            return result;
        } else {
            return null;
        }
    }

    public static void start(Context context) {
        if (sInstance == null) {
            sInstance = new Chetbot(context);
        }
    }

    // based on https://androidreclib.wordpress.com/2014/11/22/getting-the-current-activity/
    private Activity getActivity(){
        try {
            Class activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
            Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
            activitiesField.setAccessible(true);
            // TODO: handle API < 19
            // (ArrayMap is new for API 19)
            ArrayMap activities = (ArrayMap) activitiesField.get(activityThread);
            for (Object activityRecord : activities.values()) {
                Class activityRecordClass = activityRecord.getClass();
                Field pausedField = activityRecordClass.getDeclaredField("paused");
                pausedField.setAccessible(true);
                if (!pausedField.getBoolean(activityRecord)) {
                    Field activityField = activityRecordClass.getDeclaredField("activity");
                    activityField.setAccessible(true);
                    Activity activity = (Activity) activityField.get(activityRecord);
                    if (activity.getPackageName().equals(mPackageName)) {
                        return activity;
                    } else {
                        Log.w(TAG, "Found activity for different package: " + activity.getPackageName());
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return null;

        // The above code snippet lacks exception handling and naively assumes that the first
        // running Activity is the one we’re looking for. You might want to add some additional
        // checks.
    }

}
