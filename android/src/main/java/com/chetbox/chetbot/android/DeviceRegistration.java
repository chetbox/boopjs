package com.chetbox.chetbot.android;

import com.google.gson.annotations.SerializedName;

public class DeviceRegistration {

    @SerializedName("register_device")
    private final String deviceId;

    public DeviceRegistration(String deviceId) {
        this.deviceId = deviceId;
    }

}
