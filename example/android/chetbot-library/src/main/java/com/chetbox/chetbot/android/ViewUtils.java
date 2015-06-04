package com.chetbox.chetbot.android;

import android.app.Activity;
import android.view.View;

import com.google.common.base.Function;

import java.util.ArrayList;

public class ViewUtils {

    public static View getRootView(Activity activity) {
        return activity.getWindow().getDecorView().findViewById(android.R.id.content);
    }

    public static class SubViews implements Function<View, Iterable<View>> {

        private final String mText;

        public SubViews(String text) {
            mText = text;
        }

        @Override
        public Iterable<View> apply(View input) {
            final ArrayList<View> matchingViews = new ArrayList<>();
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

}
