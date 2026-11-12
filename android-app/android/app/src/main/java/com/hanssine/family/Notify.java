package com.hanssine.family;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.Map;

/** 알림 종류(채널)와 표시. 화면이 꺼져 있으면 잠깐 켜서 보여 줌 */
public class Notify {
    public static final String CH_FAMILY = "family";
    public static final String CH_SOS = "sos";

    public static void createChannels(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel fam = new NotificationChannel(CH_FAMILY, "가족 소식", NotificationManager.IMPORTANCE_HIGH);
        fam.setDescription("대화, 사진, 일정, 공지");
        fam.enableVibration(true);
        fam.setVibrationPattern(new long[]{0, 200, 100, 200});
        fam.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(fam);
        NotificationChannel sos = new NotificationChannel(CH_SOS, "긴급 연락", NotificationManager.IMPORTANCE_HIGH);
        sos.setDescription("부모님 긴급 연락");
        sos.enableVibration(true);
        sos.setVibrationPattern(new long[]{0, 600, 200, 600, 200, 1200});
        sos.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        sos.setBypassDnd(true);
        AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        sos.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), aa);
        nm.createNotificationChannel(sos);
    }

    public static void show(Context c, Map<String, String> d) {
        createChannels(c);
        String k = val(d, "k"), id = val(d, "id");
        boolean sos = "sos".equals(k);
        String tag = val(d, "tag").isEmpty() ? k + "-" + id : val(d, "tag");

        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("push_k", k);
        open.putExtra("push_id", id);
        int req = tag.hashCode();
        PendingIntent pi = PendingIntent.getActivity(c, req, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(c, sos ? CH_SOS : CH_FAMILY)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setColor(0xFF2E6A4E)
                .setContentTitle(val(d, "title").isEmpty() ? "한씨네" : val(d, "title"))
                .setContentText(val(d, "body"))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(val(d, "body")))
                .setAutoCancel(true)
                .setOnlyAlertOnce(false)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(sos ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
                .setCategory(sos ? NotificationCompat.CATEGORY_ALARM : NotificationCompat.CATEGORY_MESSAGE)
                .setContentIntent(pi);
        if (sos) {
            b.setOngoing(false);
            // 긴급: 잠금화면 위에 바로 띄움 (권한이 있을 때)
            if (canFullScreen(c)) b.setFullScreenIntent(pi, true);
        }
        wakeScreen(c);
        try {
            NotificationManagerCompat.from(c).notify(tag, 1, b.build());
        } catch (SecurityException e) {
            // 알림 권한이 없으면 표시하지 않음
        }
    }

    private static boolean canFullScreen(Context c) {
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            return nm != null && nm.canUseFullScreenIntent();
        }
        return true;
    }

    /** 화면이 꺼져 있으면 몇 초간 켜서 잠금화면에 알림이 보이게 함 */
    @SuppressWarnings("deprecation")
    private static void wakeScreen(Context c) {
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm == null || pm.isInteractive()) return;
            PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "hanssine:notify");
            wl.acquire(5000);
        } catch (Exception ignored) {
        }
    }

    private static String val(Map<String, String> d, String key) {
        String v = d.get(key);
        return v == null ? "" : v;
    }
}
