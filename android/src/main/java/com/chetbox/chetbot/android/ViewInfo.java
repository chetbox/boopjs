package com.chetbox.chetbot.android;

import android.graphics.Rect;

public class ViewInfo {

    final Rect position;
    final String type;
    final String text;
    final String id;

    public ViewInfo(Rect position, String type, String text, String id) {
        this.position = new Rect(position.left, position.top, position.right, position.bottom);
        this.text = text;
        this.id = id;
        this.type = type;
    }

    public ViewInfo(Rect position, String type) {
        this(position, type, null, null);
    }

    public ViewInfo(Rect position, String type, String text) {
        this(position, type, text, null);
    }

}
