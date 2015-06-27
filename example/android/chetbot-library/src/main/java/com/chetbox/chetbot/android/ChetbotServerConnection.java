package com.chetbox.chetbot.android;

import android.graphics.Bitmap;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

import static com.chetbox.chetbot.android.ViewUtils.*;

public class ChetbotServerConnection extends WebSocketClient {

    public interface MessageHandler {
        Object onMessage(Command[] message) throws IllegalArgumentException;
    }

    public static class Message {
        private String device;
        private Command[] commands;

        public Command[] getCommands() {
            return commands.clone();
        }

        public String getDevice() {
            return device;
        }
    }

    private static class Result {
        private String device;
        private String type;
        private Object result;

        public Result(String device, String type, Object result) {
            this.device = device;
            this.type = type;
            this.result = result;
        }
    }

    private static class Error {
        private String device;
        private String error;

        public Error(String device, String message) {
            this.device = device;
            this.error = message;
        }
    }

    private static final String TAG = ChetbotServerConnection.class.getSimpleName();

    private static Gson sGson = new GsonBuilder().serializeNulls().create();

    private final String mSessionId;
    private final MessageHandler mMessageHandler;

    public ChetbotServerConnection(String sessionId, MessageHandler messageHandler) {
        super(URI.create("ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com"));
        mSessionId = sessionId;
        mMessageHandler = messageHandler;
    }

    @Override
    public void onOpen(ServerHandshake handshakeData) {
        Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
        send(sGson.toJson(new Command(Command.Name.REGISTER_DEVICE_SESSION, mSessionId)));
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        Log.d(TAG, "Connection closed (" + reason + ")");
    }

    @Override
    public void onMessage(String messageStr) {
        Log.v(TAG, "Message received: " + messageStr);
        Message message = sGson.fromJson(messageStr, Message.class);
        try {
            Object result = mMessageHandler.onMessage(message.getCommands());
            send(sGson.toJson(makeResult(message.getDevice(), result)));
        } catch (Exception e) {
            Log.e(TAG, "error: " + sGson.toJson(new Error(message.getDevice(), e.getMessage())));
            e.printStackTrace();
            send(sGson.toJson(new Error(message.getDevice(), e.getMessage())));
        }
    }

    @Override
    public void onError(Exception e) {
        e.printStackTrace();
    }

    public static boolean isSupportedResultType(Object o) {
        return o == null
                || o instanceof String
                || o instanceof Integer
                || o instanceof Long
                || o instanceof Float
                || o instanceof Double
                || o instanceof Boolean
                || o instanceof String[]
                || o instanceof int[]
                || o instanceof long[]
                || o instanceof float[]
                || o instanceof double[]
                || o instanceof boolean[]
                || o instanceof Bitmap;
    }

    private static Result makeResult(String device, Object data) {
        String type = (data != null)
            ? data.getClass().getSimpleName().toUpperCase()
            : "NULL";
        if (data instanceof Bitmap) {
            data = base64Encode(toPNG((Bitmap) data));
        }
        return new Result(device, type, data);
    }

}
