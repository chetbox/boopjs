package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Context;
import android.view.View;

import com.google.common.base.Function;
import com.google.common.collect.Ordering;

import java.util.ArrayList;

import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.*;


public class ViewUtils {

    public static Iterable<View> asViews(Iterable<?> views) {
        return (Iterable<View>) views;
    }

    public static View firstView(Iterable<?> views) {
        return (View) get(views, 0);
    }

    public static View getRootView(Activity activity) {
        return activity.getWindow().getDecorView().findViewById(android.R.id.content);
    }

    public static class SubViews implements Function<View, Iterable<View>> {

        private final String mText;
        private final String mType;
        private final String mId;

        public SubViews(String text, String type, String id) {
            mText = text;
            mType = type;
            mId = id;

            if (type != null) {
                throw new UnsupportedOperationException("'type' specifier not yet implemented");
            }
        }

        @Override
        public Iterable<View> apply(View input) {
            // TODO: support multiple views with same ID. Combine with type, class.
            if (mId != null) {
                View v = input.findViewById(getIdentifier(mId, input.getContext()));
                return (ArrayList<View>) (v != null ? newArrayList(v) : newArrayList());
            }

            // assume mText exists
            ArrayList<View> matchingViews = new ArrayList<>();
            // TODO: make substrings optional (this impl. allows substrings)
            input.findViewsWithText(matchingViews, mText, View.FIND_VIEWS_WITH_TEXT);
            return matchingViews;
        }

        @Override
        public boolean equals(Object that) {
            return this == that
                    || (that.getClass() == SubViews.class
                    && ((SubViews) that).mText == this.mText);
        }
    }

    public static int[] location(View v) {
        int[] location = new int[2];
        v.getLocationInWindow(location);
        return location;
    }

    public static int[] size(View v) {
        return new int[]{v.getWidth(), v.getHeight()};
    }

    public static int[] center(View v) {
        int[] location = location(v),
              size = size(v);
        return new int[]{location[0] + size[0]/2,
                         location[1] + size[1]/2};
    }

    public static Ordering<View> horizontalOrdering = new Ordering<View>() {
        @Override
        public int compare(View a, View b) {
            return location(a)[0] - location(b)[0];
        }
    };

    public static Ordering<View> verticalOrdering = new Ordering<View>() {
        @Override
        public int compare(View a, View b) {
            return location(a)[1] - location(b)[1];
        }
    };

    public static class EuclidianDistanceOrdering extends Ordering<View> {

        private final int[] mTarget;

        public EuclidianDistanceOrdering(int[] target) {
            mTarget = target;
        }

        @Override
        public int compare(View a, View b) {
            int[] centerA = center(a),
                  centerB = center(b);
            int dxA = centerA[0] - mTarget[0],
                dyA = centerA[1] - mTarget[1],
                dxB = centerB[0] - mTarget[0],
                dyB = centerB[1] - mTarget[1];
            return (dxA * dxA + dyA * dyA) - (dxB * dxB + dyB * dyB);
        }
    }

    private static int getIdentifier(String idStr, Context context) {
        int id = context.getResources().getIdentifier(idStr, "id", context.getPackageName());
        if (id == 0) {
            throw new RuntimeException("No view with ID \"" + idStr + "\" found in package (" + context.getPackageName() + ")");
        }
        return id;
    }

}
