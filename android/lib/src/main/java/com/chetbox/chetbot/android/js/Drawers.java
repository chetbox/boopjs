package com.chetbox.chetbot.android.js;

public class Drawers {

    public static String source() {
        return "function open_drawer(which) {\n" +
                "  which = which || 'START';\n" +
                "  activity().runOnUiThread(function() {\n" +
                "    view({type: 'DrawerLayout'}).openDrawer(Packages.android.support.v4.view.GravityCompat[which.toUpperCase()]);\n" +
                "  });\n" +
                "  wait(0.75);\n" +
                "}\n" +
                "function close_drawer(which) {\n" +
                "  which = which || 'START';\n" +
                "  activity().runOnUiThread(function() {\n" +
                "    view({type: 'DrawerLayout'}).closeDrawer(Packages.android.support.v4.view.GravityCompat[which.toUpperCase()]);\n" +
                "  });\n" +
                "  wait(0.75);\n" +
                "}\n";
    }

}
