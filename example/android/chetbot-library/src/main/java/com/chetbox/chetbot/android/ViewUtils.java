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

    private static int getIdentifier(String idStr, Context context) {
        int id = context.getResources().getIdentifier(idStr, "id", context.getPackageName());
        if (id == 0) {
            throw new RuntimeException("No view with ID \"" + idStr + "\" found in package (" + context.getPackageName() + ")");
        }
        return id;
    }

}
