package com.chetbox.chetbot.android;

import android.app.Activity;
import android.graphics.Bitmap;
import android.text.TextUtils;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.google.common.base.Function;
import com.google.common.base.Predicate;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Ordering;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;

import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.*;


public class ViewUtils {

    public static View firstView(Iterable<?> views) {
        return (View) get(views, 0);
    }

    public static View getRootView(Activity activity) {
        return activity.getWindow().getDecorView().findViewById(android.R.id.content);
    }

    public static class SubViews implements Function<Iterable<View>, Iterable<View>> {

        private final Predicate<View> mViewPredicate;

        public SubViews(final String text, final String type, final String id) {

            if (TextUtils.isEmpty(text) && TextUtils.isEmpty(type) && TextUtils.isEmpty(id)) {
                throw new IllegalArgumentException("At least one of text, type and id must be specified");
            }

            mViewPredicate = new Predicate<View>() {

                Predicate<View> textPredicate = new Predicate<View>() {
                    @Override
                    public boolean apply(View input) {
                        if (!(input instanceof TextView)) {
                            return false;
                        }

                        CharSequence viewText = ((TextView) input).getText();
                        CharSequence hintText = ((TextView) input).getHint();
                        if (TextUtils.isEmpty(viewText) && TextUtils.isEmpty(hintText)) {
                            return false;
                        }

                        // Here we know some text is displayed and we have text to match.
                        // viewText or hintText must match.

                        if (!TextUtils.isEmpty(viewText)) {
                            // Text is showing
                            return text.equalsIgnoreCase(viewText.toString());
                        } else {
                            // Hint is showing
                            return text.equalsIgnoreCase(hintText.toString());
                        }
                    }
                };

                Predicate<View> typePredicate = new Predicate<View>() {
                    @Override
                    public boolean apply(View input) {
                        if (type.indexOf('.') >= 0) {
                            // With Java package
                            return type.equalsIgnoreCase( input.getClass().getName() );
                        } else {
                            // Without Java package
                            return type.equalsIgnoreCase( input.getClass().getSimpleName() );
                        }
                    }
                };

                Predicate<View> idPredicate = new Predicate<View>() {
                    @Override
                    public boolean apply(View input) {
                        int inputId = input.getId();
                        if (inputId == -1) {
                            return false;
                        }
                        String inputIdStr = input.getResources().getResourceName(inputId);
                        if (id.contains("/")) {
                            return id.equalsIgnoreCase(inputIdStr);
                        } else {
                            // match without namespace, if not supplied
                            return !TextUtils.isEmpty(inputIdStr) && inputIdStr.endsWith("/" + id);
                        }
                    }
                };

                @Override
                public boolean apply(View input) {
                    return (TextUtils.isEmpty(text) || textPredicate.apply(input))
                            && (TextUtils.isEmpty(type) || typePredicate.apply(input))
                            && (TextUtils.isEmpty(id) || idPredicate.apply(input));
                }
            };
        }

        private static Function<View, Iterable<View>> sChildViews = new Function<View, Iterable<View>>() {
            @Override
            public Iterable<View> apply(View view) {
                if (view instanceof ViewGroup) {
                    ViewGroup viewGroup = (ViewGroup) view;
                    ArrayList<View> children = newArrayList();
                    for (int i=0; i<viewGroup.getChildCount(); i++) {
                        children.add(viewGroup.getChildAt(i));
                    }
                    return ImmutableList.copyOf(children);
                } else {
                    return ImmutableList.of();
                }
            }
        };

        @Override
        public Iterable<View> apply(Iterable<View> views) {
            if (isEmpty(views)) {
                return ImmutableList.of();
            }
            Iterable<View> matchingViews = filter(views, mViewPredicate);
            Iterable<View> childViews = concat(transform(views, sChildViews));
            return concat(matchingViews, apply(childViews));
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

    public static String base64Encode(byte[] data) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            outputStream.write(Base64.encode(data, Base64.DEFAULT));
            return outputStream
                    .toString("UTF-8")
                    .replaceAll("[\r\n]", "");
        } catch (IOException e) {
            throw new RuntimeException("This should never happen!", e);
        }
    }

    public static Bitmap screenshot(final Activity activity) {
        final Container<Bitmap> screenshotContainer = new Container<>();
        final CountDownLatch latch = new CountDownLatch(1);
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                View decorView = activity.getWindow().getDecorView();
                decorView.destroyDrawingCache();
                decorView.setDrawingCacheEnabled(true);
                try {
                    Bitmap screenshot = decorView.getDrawingCache();
                    screenshotContainer.contents = screenshot.copy(screenshot.getConfig(), false);
                } finally {
                    decorView.setDrawingCacheEnabled(false);
                    latch.countDown();
                }
            }
        });
        try {
            latch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return screenshotContainer.contents;
    }

    public static byte[] toPNG(Bitmap bitmap) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 0, outputStream);
        return outputStream.toByteArray();
    }

}
