package com.chetbox.chetbot.android;

import android.graphics.Rect;

public class View__ {

    final Rect position;
    final String type;
    final String text;
    final String id;

    public View__(Rect position, String type, String text, String id) {
        this.position = new Rect(position.left, position.top, position.right, position.bottom);
        this.text = text;
        this.id = id;
        this.type = type;
    }

    public View__(Rect position, String type) {
        this(position, type, null, null);
    }

    public View__(Rect position, String type, String text) {
        this(position, type, text, null);
    }

}
