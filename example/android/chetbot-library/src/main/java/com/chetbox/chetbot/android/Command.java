package com.chetbox.chetbot.android;


public class Command {

    public enum Name {
        // Traversing
        VIEW,
        COUNT,
        EXISTS,
        LEFTMOST,
        RIGHTMOST,
        TOPMOST,
        BOTTOMMOST,
        CLOSEST_TO,
        FURTHEST_FROM,

        // Data
        TEXT,
        LOCATION,
        CENTER,
        SIZE,
        ID,
        TYPE,
        SCREENSHOT,

        // Interaction
        TAP,
        BACK,
        HOME,
    }

    private Name name;
    private String[] args;

    public Name getName() {
        return name;
    }

    public String getText() {
        return args.length > 0 ? args[0] : null;
    }

    public String getType() {
        return args.length > 1 ? args[1] : null;
    }

    public String getId() {
        return args.length > 2 ? args[2] : null;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(name);
        sb.append(" (");
        if (args != null) {
            for (int i=0; i<args.length; i++) {
                sb.append(args[i]);
                if (i != args.length - 1) {
                    sb.append(", ");
                }
            }
        }
        sb.append(')');
        return sb.toString();
    }
}
