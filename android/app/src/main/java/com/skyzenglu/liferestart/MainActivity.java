package com.skyzenglu.liferestart;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;

import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int WRITE_PERMISSION_REQUEST = 90211;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SkyLoggerPlugin.class);
        super.onCreate(savedInstanceState);
        requestLogPermission();
    }

    private void requestLogPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (Environment.isExternalStorageManager()) return;
            new AlertDialog.Builder(this)
                .setTitle("日志保存权限")
                .setMessage(
                    "为了让日志保存到手机存储的 skyzl/liferestart 文件夹，请授予“所有文件访问权限”。"
                )
                .setPositiveButton("去授权", (dialog, which) -> openManageStorageSettings())
                .setNegativeButton("暂不", null)
                .show();
            return;
        }
        if (
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE },
                WRITE_PERMISSION_REQUEST
            );
        }
    }

    private void openManageStorageSettings() {
        try {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
        } catch (Exception ignored) {
            startActivity(new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION));
        }
    }
}
