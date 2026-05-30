package com.diautria.carlitos;

import android.graphics.Color;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTheme")
public class NativeThemePlugin extends Plugin {

    @PluginMethod
    public void setSystemBarColors(PluginCall call) {
        String statusBarColor = call.getString("statusBarColor", "#ffffff");
        String navigationBarColor = call.getString("navigationBarColor", "#ffffff");
        Boolean dark = call.getBoolean("dark", false);

        getBridge().executeOnMainThread(() -> {
            Window window = getActivity().getWindow();
            int statusColor = Color.parseColor(statusBarColor);
            int navigationColor = Color.parseColor(navigationBarColor);
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());

            window.setStatusBarColor(statusColor);
            window.setNavigationBarColor(navigationColor);
            window.getDecorView().setBackgroundColor(navigationColor);
            controller.setAppearanceLightStatusBars(!dark);
            controller.setAppearanceLightNavigationBars(!dark);

            call.resolve();
        });
    }
}
