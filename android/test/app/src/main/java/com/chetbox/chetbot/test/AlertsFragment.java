package com.chetbox.chetbot.test;

import android.content.DialogInterface;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v7.app.AlertDialog;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

public class AlertsFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final View view = inflater.inflate(R.layout.alerts, container, false);

        view.findViewById(R.id.confirmation).setOnClickListener(new View.OnClickListener() {

            private final TextView status = (TextView) view.findViewById(R.id.status);

            @Override
            public void onClick(View view) {
                new AlertDialog.Builder(getContext())
                        .setMessage(R.string.alert_please_confirm)
                        .setPositiveButton(R.string.alert_confirm, new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                status.setText(R.string.alert_confirm);
                            }
                        })
                        .setNegativeButton(R.string.alert_deny, new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                status.setText(R.string.alert_deny);
                            }
                        })
                        .create()
                        .show();
            }
        });

        return view;
    }

}
