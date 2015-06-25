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

        // Interaction
        TAP,
        BACK,

        // Server API
        RESULT,
        REGISTER_DEVICE_SESSION
    }

    private Name name;
    private String[] args;

    public Command(Name name, String... args) {
        this.name = name;
        this.args = args;
    };

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