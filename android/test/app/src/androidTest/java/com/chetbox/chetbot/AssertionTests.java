package com.chetbox.chetbot;

import com.chetbox.chetbot.base.BaseTest;

import org.junit.Test;

public class AssertionTests extends BaseTest {

    @Test public void assertTrue() {
        // No exception
        exec("assert_true(true);");
        exec("assert_true('qwertyuiop');");
        exec("assert_true(12345678);");
        exec("assert_true([1,2,3]);");
        exec("assert_true([]);");

        exception.expect(Exception.class);
        exec("assert_true(false);");
    }

    @Test public void assertFalse() {
        // No exception
        exec("assert_false(false);");
        exec("assert_false(0);");
        exec("assert_false(null);");
        exec("assert_false('');");

        exception.expect(Exception.class);
        exec("assert_false(true);");
    }

    @Test public void assertEqual() {
        // No exception
        exec("assert_equal(true, true);");
        exec("assert_equal(false, false);");
        exec("assert_equal(null, null);");
        exec("assert_equal(12345678, 12345678);");
        exec("assert_equal('qwertyuiop', 'qwertyuiop');");
        exec("assert_equal('123', 123);");

        exception.expect(Exception.class);
        exec("assert_equal(123, 321);");
    }

    @Test public void assertVisible() {
        // No exception
        exec("assert_visible('reset');");
        exec("assert_visible({text: 'reset'});");

        exception.expect(Exception.class);
        exec("assert_visible('does not exist');");
    }

}