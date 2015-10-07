package com.chetbox.chetbot;

import android.graphics.Bitmap;

import com.chetbox.chetbot.base.screens.StopwatchTest;

import org.junit.Test;

import static org.hamcrest.MatcherAssert.assertThat;

import static com.chetbox.chetbot.util.GenericMatchers.*;
import static com.chetbox.chetbot.util.Lists.*;

public class SelectorTests extends StopwatchTest {

    @Test
    public void multipleViews() {
        assertThat(arrayAsList(exec("views({type: 'AppCompatButton'})")),
                contains(startStopButton, resetButton));
    }

    @Test public void viewReturnsInstance() {
        assertThat(exec("view(_startStopButton_)"),
                sameInstance(startStopButton));
    }

    @Test public void viewReturnsFirstInstance() {
        assertThat(exec("view(_resetButton_, _startStopButton_)"),
                sameInstance(resetButton));
    }

    @Test public void findViewByTextIsDefault() {
        assertThat(exec("view('start')"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByText() {
        assertThat(exec("view({text: 'start'})"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByText_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("text({text: 'nonsense'})");
    }

    @Test public void findViewByShortId() {
        assertThat(exec("view({id: 'start_stop'})"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByShortId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'i_do_not_exist'})");
    }

    @Test public void findViewByLongId() {
        assertThat(exec("view({id: 'com.chetbox.chetbot.test:id/reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewByLongId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'com.chetbox.chetbot.test:id/i_do_not_exist'})");
    }

    @Test public void findViewsByClassName() {
        assertThat(exec("view({type: 'android.support.v7.widget.AppCompatButton', text: 'start'})"),
                sameInstance(startStopButton));

        assertThat(exec("view({type: 'android.support.v7.widget.AppCompatButton', text: 'reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewsByClassSimpleName() {
        assertThat(exec("view({type: 'AppCompatButton', text: 'start'})"),
                sameInstance(startStopButton));

        assertThat(exec("view({type: 'AppCompatButton', text: 'reset'})"),
                sameInstance(resetButton));
    }

    @Test public void textViewExists() {
        assertThat(exec("exists('reset')"),
                equalTo(Boolean.TRUE));
    }

    @Test public void textViewDoesNotExist() {
        assertThat(exec("exists('i do not exist')"),
                equalTo(Boolean.FALSE));
    }

    @Test public void viewType() {
        assertThat(exec("class_of(_resetButton_)"),
                equalTo("AppCompatButton"));
    }

    @Test public void viewText() {
        assertThat(exec("text(_startStopButton_)"),
                equalToIgnoringCase("start"));
    }

    @Test public void viewText_notTextView() {
        exception.expect(ClassCastException.class);
        exec("text({type: 'RelativeLayout'})");
    }

    @Test public void countInstances() {
        assertThat(exec("count(_startStopButton_, _resetButton_)"),
                equalTo(2));
    }

    @Test public void countViewsWithClassSimpleName() {
        assertThat(exec("count({type: 'AppCompatButton'})"),
                equalTo(2));
    }

    @Test public void countViewsWithText() {
        assertThat(exec("count('00')"),
                equalTo(2));
    }

    @Test public void locationOfHorizontalButtons() {
        int[] startStopLocation = exec("location(_startStopButton_)");
        int[] resetLocation = exec("location(_resetButton_)");

        assertThat("[start] left of [reset]",
                startStopLocation[0], lessThan(resetLocation[0]));

        assertThat("Same vertical alignment",
                startStopLocation[1], equalTo(resetLocation[1]));
    }

    @Test public void centerOfHorizontalButtons() {
        int[] startStopCenter = exec("center(_startStopButton_)");
        int[] resetCenter = exec("center(_resetButton_)");

        assertThat("[start] left of [reset]",
                startStopCenter[0], lessThan(resetCenter[0]));

        assertThat("Same vertical alignment",
                startStopCenter[1], equalTo(resetCenter[1]));
    }

    @Test public void sizeOfButton() {
        int[] resetSize = exec("size(_resetButton_)");

        assertThat(resetSize[0], greaterThan(1));
        assertThat(resetSize[1], greaterThan(1));
    }

    @Test public void location_center_size() {
        int[] resetSize = exec("size(_resetButton_)");
        int[] resetCenter = exec("center(_resetButton_)");
        int[] resetLocation = exec("location(_resetButton_)");

        assertThat(resetCenter[0], equalTo(resetLocation[0] + resetSize[0] / 2));
        assertThat(resetCenter[1], equalTo(resetLocation[1] + resetSize[1] / 2));
    }

    @Test public void screenshotPngDataUrl() {
        assertThat(exec("screenshot()"), isA(Bitmap.class));
    }

    @Test public void leftmostView() {
        assertThat(exec("leftmost(_startStopButton_, _resetButton_)"),
                sameInstance(startStopButton));
    }

    @Test public void rightmostView() {
        assertThat(exec("rightmost(_startStopButton_, _resetButton_)"),
                sameInstance(resetButton));
    }

    @Test public void topmostView() {
        assertThat(exec("topmost(_startStopButton_, _minutesText_)"),
                sameInstance(minutesText));
    }

    @Test public void bottommostView() {
        assertThat(exec("bottommost(_startStopButton_, _minutesText_)"),
                sameInstance(startStopButton));
    }

    @Test public void centermostView() {
        assertThat(exec("centermost(_minutesText_, _secondsText_, _millisecondsText_)"),
                sameInstance(secondsText));
    }

    @Test public void outermostView() {
        assertThat(exec("outermost(_minutesText_, _secondsText_, _millisecondsText_)"),
                anyOf(sameInstance(minutesText), sameInstance(millisecondsText)));
    }

    @Test public void allViewIds() {
        assertThat(arrayAsList(exec("view_ids()")),
                hasItems("com.chetbox.chetbot.test:id/drawer_layout",
                        "com.chetbox.chetbot.test:id/content_frame",
                        "com.chetbox.chetbot.test:id/stopwatch_container",
                        "com.chetbox.chetbot.test:id/center",
                        "com.chetbox.chetbot.test:id/minutes",
                        "com.chetbox.chetbot.test:id/seconds",
                        "com.chetbox.chetbot.test:id/milliseconds",
                        "com.chetbox.chetbot.test:id/start_stop",
                        "com.chetbox.chetbot.test:id/reset"));
    }

    @Test public void subViewIds() {
        assertThat(arrayAsList(exec("view_ids({id: 'stopwatch_container'})")),
                contains("com.chetbox.chetbot.test:id/center",
                        "com.chetbox.chetbot.test:id/minutes",
                        "com.chetbox.chetbot.test:id/seconds",
                        "com.chetbox.chetbot.test:id/milliseconds",
                        "com.chetbox.chetbot.test:id/start_stop",
                        "com.chetbox.chetbot.test:id/reset"));
    }
}
