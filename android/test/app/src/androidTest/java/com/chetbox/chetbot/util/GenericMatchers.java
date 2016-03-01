package com.chetbox.chetbot.util;

import com.google.common.base.Function;
import com.google.common.collect.Iterables;

import org.hamcrest.Matcher;
import org.hamcrest.Matchers;

public class GenericMatchers {

    public static Matcher<Object> sameInstance(Object o) {
        return Matchers.sameInstance(o);
    }

    public static Matcher<Object> is(Object o) {
        return Matchers.is(o);
    }

    public static Matcher<Object> isA(Class clazz) {
        return Matchers.isA(clazz);
    }

    public static Matcher<Object> not(Matcher matcher) {
        return Matchers.not(matcher);
    }

    public static Matcher<Object> contains(Object... items) {
        return genericMatcher(Matchers.contains(items));
    }

    public static Matcher<Object> containsInAnyOrder(Object... items) {
        return genericMatcher(Matchers.containsInAnyOrder(items));
    }

    public static Matcher<Object> hasItems(Object... items) {
        return genericMatcher(Matchers.hasItems(items));
    }

    public static Matcher<Object> anyOf(Matcher<Object>... items) {
        return genericMatcher(Matchers.anyOf(items));
    }

    public static Matcher<Object> equalTo(Object o) {
        return Matchers.equalTo(o);
    }

    public static Matcher<Object> equalToIgnoringCase(final String expectedString) {
        return genericMatcher(Matchers.equalToIgnoringCase(expectedString));
    }

    public static <T extends Comparable> Matcher<Object> lessThan(T value) {
        return (Matcher<Object>) Matchers.lessThan(value);
    }

    public static <T extends Comparable> Matcher<Object> greaterThan(T value) {
        return (Matcher<Object>) Matchers.greaterThan(value);
    }

    private static Matcher<Object> genericMatcher(final Matcher<?> matcher) {
        return (Matcher<Object>) matcher;
    }

}