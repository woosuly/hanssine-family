package com.hanssine.family;

import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.view.View;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** 앱 화면이 지금 보이는지 (보이면 알림 대신 앱 안에서 진동·소리) */
    public static volatile boolean foreground = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HanssineNativePlugin.class);
        super.onCreate(savedInstanceState);
        setupBars();
        Notify.createChannels(this);
        HanssineNativePlugin.takeIntent(getIntent());
    }

    /** 위쪽 상태바 자리: 스킨 색 얇은 띠 + 흰 아이콘, 아래쪽 버튼 자리: 앱 바탕색 */
    static MainActivity self;
    private final BarDrawable bar = new BarDrawable();

    private void setupBars() {
        self = this;
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        View decor = getWindow().getDecorView();
        decor.setBackground(bar);
        WindowCompat.getInsetsController(getWindow(), decor).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), decor).setAppearanceLightNavigationBars(true);
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, ins) -> {
            Insets b = ins.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = ins.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(b.left, b.top, b.right, Math.max(b.bottom, ime.bottom));
            bar.top = b.top;
            bar.invalidateSelf();
            return WindowInsetsCompat.CONSUMED;
        });
    }

    /** 웹 화면에서 스킨이 바뀌면 띠 색 변경 */
    static void setBarColor(int color, int bg) {
        MainActivity a = self;
        if (a == null) return;
        a.runOnUiThread(() -> { a.bar.top_color = color; a.bar.bg_color = bg; a.bar.invalidateSelf(); });
    }

    static class BarDrawable extends Drawable {
        int top = 0;
        int top_color = 0xFF2E6A4E;
        int bg_color = 0xFFF3F4EF;
        private final Paint p = new Paint();
        @Override public void draw(Canvas c) {
            android.graphics.Rect r = getBounds();
            p.setColor(bg_color); c.drawRect(r, p);
            p.setColor(top_color); c.drawRect(r.left, r.top, r.right, r.top + top, p);
        }
        @Override public void setAlpha(int a) {}
        @Override public void setColorFilter(ColorFilter f) {}
        @Override public int getOpacity() { return PixelFormat.OPAQUE; }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        HanssineNativePlugin.takeIntent(intent);
        HanssineNativePlugin.firePushOpen();
    }

    @Override
    public void onResume() {
        super.onResume();
        foreground = true;
        // 앱을 열면 쌓인 알림 정리
        NotificationManagerCompat.from(this).cancelAll();
    }

    @Override
    public void onPause() {
        super.onPause();
        foreground = false;
    }
}
