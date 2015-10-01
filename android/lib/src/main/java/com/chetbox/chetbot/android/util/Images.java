package com.chetbox.chetbot.android.util;

import android.graphics.Bitmap;
import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class Images {

    public static String base64Encode(byte[] data) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            outputStream.write(Base64.encode(data, Base64.DEFAULT));
            return outputStream
                    .toString("UTF-8")
                    .replaceAll("[\r\n]", "");

        } catch (IOException impossible) {
            throw new RuntimeException("This should never happen!", impossible);
        }
    }

    public static byte[] toPNG(Bitmap bitmap) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 0, outputStream);
        return outputStream.toByteArray();
    }

}
