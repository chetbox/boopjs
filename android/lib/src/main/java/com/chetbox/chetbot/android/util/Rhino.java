package com.chetbox.chetbot.android.util;

import android.app.Activity;
import android.graphics.Bitmap;
import android.view.View;

import com.google.common.collect.ImmutableList;
import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import org.json.JSONArray;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.Wrapper;

import java.lang.reflect.Type;

import javax.annotation.concurrent.Immutable;

public class Rhino {

    public static final Gson GSON = new GsonBuilder()
            .serializeNulls()
            .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
            .registerTypeHierarchyAdapter(Wrapper.class, new JsonSerializer<Wrapper>() {
                @Override
                public JsonElement serialize(Wrapper src, Type typeOfSrc, JsonSerializationContext context) {
                    return GSON.toJsonTree(src.unwrap());
                }
            })
            .registerTypeHierarchyAdapter(View.class, new JsonSerializer<View>() {
                @Override
                public JsonElement serialize(View src, Type typeOfSrc, JsonSerializationContext context) {
                    JsonObject view = new JsonObject();
                    view.addProperty("_id", System.identityHashCode(src));
                    view.addProperty("type", View.class.getName());
                    view.addProperty("name", src.getClass().getName());
                    JsonArray size = new JsonArray();
                    size.add(new JsonPrimitive(src.getWidth()));
                    size.add(new JsonPrimitive(src.getHeight()));
                    view.add("size", size);
                    return view;
                }
            })
            .registerTypeHierarchyAdapter(Activity.class, new JsonSerializer<Activity>() {
                @Override
                public JsonElement serialize(Activity src, Type typeOfSrc, JsonSerializationContext context) {
                    JsonObject activity = new JsonObject();
                    activity.addProperty("_id", System.identityHashCode(src));
                    activity.addProperty("type", Activity.class.getName());
                    activity.addProperty("name", src.getClass().getName());
                    return activity;
                }
            })
            .registerTypeAdapter(Bitmap.class, new JsonSerializer<Bitmap>() {
                @Override
                public JsonElement serialize(Bitmap src, Type typeOfSrc, JsonSerializationContext context) {
                    JsonObject bitmap = new JsonObject();
                    bitmap.addProperty("type", "BITMAP");
                    bitmap.addProperty("uri", "data:image/png;base64," + Images.base64Encode(Images.toPNG(src)));
                    return bitmap;
                }
            })
            .registerTypeAdapter(Undefined.class, new JsonSerializer<Undefined>() {
                @Override
                public JsonElement serialize(Undefined src, Type typeOfSrc, JsonSerializationContext context) {
                    return JsonNull.INSTANCE;
                }
            })
            .create();

    public static Object unwrapJavaObject(Object o) {
        return (o instanceof Wrapper)
                ? ((Wrapper) o).unwrap()
                : o;
    }

    public static Object wrapJavaObject(Object o, Context context, Scriptable scope) {
        return (o != null)
                ? context.toObject(o, scope)
                : null;
    }

}
