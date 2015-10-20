package com.chetbox.chetbot.android.activity;

import android.app.Activity;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.RelativeLayout;

public class EditTextActivity extends Activity {

    public static final String INPUT_TYPE = "inputType";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int inputType = getIntent().getIntExtra("inputType", InputType.TYPE_CLASS_TEXT |
                                                             InputType.TYPE_TEXT_FLAG_CAP_SENTENCES |
                                                             InputType.TYPE_TEXT_FLAG_MULTI_LINE);

        RelativeLayout contentView = new RelativeLayout(this);
        {
            EditText editText = new EditText(this);
            editText.setInputType(inputType);
            editText.setLines(8);
            editText.setGravity(Gravity.TOP);
            {
                RelativeLayout.LayoutParams editTextLayout = new RelativeLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT);
                editTextLayout.addRule(RelativeLayout.CENTER_HORIZONTAL);
                editTextLayout.addRule(RelativeLayout.ALIGN_PARENT_TOP);
                editText.setLayoutParams(editTextLayout);
            }
            contentView.addView(editText);
        }
        setContentView(contentView);
    }
}
