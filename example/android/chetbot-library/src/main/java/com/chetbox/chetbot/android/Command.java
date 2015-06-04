package com.chetbox.chetbot.android;


public class Command {

    public enum Name {
        // Traversing
        VIEW,

        // Data
        TEXT,

        // Interaction
        TAP
    }

    private Name name;
    private String[] args;

    private Command() {};

    public Name getName() {
        return name;
    }

    public String[] getArgs() {
        return args;
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
