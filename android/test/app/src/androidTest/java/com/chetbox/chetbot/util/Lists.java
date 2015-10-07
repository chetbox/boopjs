package com.chetbox.chetbot.util;

import java.util.Arrays;
import java.util.List;

public class Lists {

    public static <T> List<T> arrayAsList(Object o) {
        return Arrays.asList((T[]) o);
    }

}
