package com.chetbox.chetbot.android;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class Container<T> {
    private final CountDownLatch mLatch = new CountDownLatch(1);

    private T mContent;

    public void setContent(T content) {
        mContent = content;
        mLatch.countDown();
    }

    public T waitForContent() {
        try {
            mLatch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return content();
    }

    public T waitForContent(long timeout, TimeUnit timeUnit) {
        try {
            mLatch.await(timeout, timeUnit);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return content();
    }

    public T content() {
        return mContent;
    }

}