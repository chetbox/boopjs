package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Intent;
import android.util.ArrayMap;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import java.lang.reflect.Field;

import static com.chetbox.chetbot.android.ViewUtils.*;

import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.*;

public class Chetbot implements ChetbotServerConnection.MessageHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static Chetbot sInstance = null;

    private final String mPackageName;
    private final String mSessionId;
    private ChetbotServerConnection mServerConnection = null;

    private Chetbot(Activity activity) {
        mPackageName = activity.getPackageName();
        mSessionId = activity.getIntent().getStringExtra("chetbot.session");

        // Connect to Chetbot server
        if (mSessionId != null) {
            Log.d(TAG, "Starting ChetBot (" + mSessionId + ")");
            Toast.makeText(activity, "Starting ChetBot", Toast.LENGTH_SHORT).show(); // TODO: remove
            mServerConnection = new ChetbotServerConnection(mSessionId, this);
        }
    }

    private static SubViews subViewsSelector(Command cmd) {
        return new SubViews(cmd.getText(), cmd.getType(), cmd.getId());
    }

    private Iterable<?> performAction(Command cmd, final Activity activity, Iterable<?> lastResults) throws IllegalArgumentException {
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
            case SCREENSHOT:
                return newArrayList( screenshot(activity) );
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
            case BACK:
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.onBackPressed();
                    }
                });
                return lastResults;
            case HOME: {
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(homeIntent);
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
        if (ChetbotServerConnection.isSupportedResultType(result)) {
            return result;
        } else {
            return null;
        }
    }

    public static void start(Activity activity) {
        if (sInstance == null) {
            sInstance = new Chetbot(activity);
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
