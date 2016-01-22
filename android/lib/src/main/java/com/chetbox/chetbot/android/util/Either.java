package com.chetbox.chetbot.android.util;

public class Either<Left, Right> {

    private final Left mLeft;
    private final Right mRight;
    private final boolean mIsLeft;

    public static <Left, Right> Either<Left, Right> left(Left val) {
        return new Either<>(true, val, null);
    }

    public static <Left, Right> Either<Left, Right> right(Right val) {
        return new Either<>(false, null, val);
    }

    private Either(boolean isLeft, Left left, Right right) {
        mLeft = left;
        mRight = right;
        mIsLeft = isLeft;
    }

    public final boolean isLeft() {
        return mIsLeft;
    }

    public final boolean isRight() {
        return !mIsLeft;
    }

    public final Left left() {
        if (!mIsLeft) throw new IllegalStateException("No left value");
        return mLeft;
    }

    public final Right right() {
        if (mIsLeft) throw new IllegalStateException("No right value");
        return mRight;
    }

    @Override
    public int hashCode() {
        return mIsLeft ? mLeft.hashCode() : mRight.hashCode();
    }

    @Override
    public boolean equals(Object that) {
        return this instanceof Either
                && ((this.mIsLeft && ((Either)that).mIsLeft && this.mLeft.equals(((Either)that).mLeft))
                    || (!this.mIsLeft && !((Either)that).mIsLeft && this.mRight.equals(((Either)that).mRight)));
    }
}
