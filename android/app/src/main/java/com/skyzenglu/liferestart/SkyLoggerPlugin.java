package com.skyzenglu.liferestart;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;

@CapacitorPlugin(name = "SkyLogger")
public class SkyLoggerPlugin extends Plugin {

    private static final String LOG_DIR = "skyzl/liferestart";
    private static final String LOG_FILE = "liferestart.log";
    private static final int WRITE_PERMISSION_REQUEST = 90212;

    private File rootLogFile() {
        return new File(
            Environment.getExternalStorageDirectory(),
            LOG_DIR + "/" + LOG_FILE
        );
    }

    private File fallbackLogFile() {
        File base = getContext().getExternalFilesDir(null);
        if (base == null) base = getContext().getFilesDir();
        return new File(base, LOG_DIR + "/" + LOG_FILE);
    }

    private boolean hasWriteAccess() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return Environment.isExternalStorageManager();
        }
        return (
            ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) ==
            PackageManager.PERMISSION_GRANTED
        );
    }

    private File logFile() {
        return hasWriteAccess() ? rootLogFile() : fallbackLogFile();
    }

    private void ensureParent(File file) {
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();
    }

    private void migrateFallback() {
        if (!hasWriteAccess()) return;
        File fallback = fallbackLogFile();
        if (!fallback.exists()) return;
        File root = rootLogFile();
        ensureParent(root);
        try (
            BufferedReader reader = new BufferedReader(new FileReader(fallback));
            BufferedWriter writer = new BufferedWriter(new FileWriter(root, true))
        ) {
            String line;
            while ((line = reader.readLine()) != null) {
                writer.write(line);
                writer.newLine();
            }
            fallback.delete();
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void append(PluginCall call) {
        String line = call.getString("line", "");
        migrateFallback();
        File file = logFile();
        try {
            ensureParent(file);
            try (
                BufferedWriter writer = new BufferedWriter(new FileWriter(file, true))
            ) {
                writer.write(line);
                writer.newLine();
            }
            call.resolve(status());
        } catch (Exception error) {
            try {
                File fallback = fallbackLogFile();
                ensureParent(fallback);
                try (
                    BufferedWriter writer = new BufferedWriter(
                        new FileWriter(fallback, true)
                    )
                ) {
                    writer.write(line);
                    writer.newLine();
                }
                call.resolve(status(fallback));
            } catch (Exception inner) {
                call.reject("write log failed: " + inner.getMessage());
            }
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName())
                    );
                    getActivity().startActivity(intent);
                } catch (Exception ignored) {}
            }
        } else if (
            ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE },
                WRITE_PERMISSION_REQUEST
            );
        }
        call.resolve(status());
    }

    private JSObject status() {
        return status(logFile());
    }

    private JSObject status(File file) {
        JSObject result = new JSObject();
        result.put("granted", hasWriteAccess());
        result.put("path", file.getAbsolutePath());
        return result;
    }
}
