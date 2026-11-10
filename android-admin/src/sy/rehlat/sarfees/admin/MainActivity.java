package sy.rehlat.sarfees.admin;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Online prototype. Authentication and web permissions stay in the browser. */
public final class MainActivity extends Activity {
    private static final String URL = "https://rihla-damascus.alaa-alghazzi2.chatgpt.site/admin";
    private TextView status;
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.setPadding(dp(28), dp(48), dp(28), dp(48));
        root.setBackgroundColor(Color.rgb(241,248,246));
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener(){ public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
            view.setPadding(dp(28), dp(28)+insets.getSystemWindowInsetTop(),dp(28),dp(28)+insets.getSystemWindowInsetBottom());
            return insets;
        }});
        TextView title = new TextView(this);
        title.setText("إدارة رحلة سرفيس"); title.setTextSize(32); title.setTextColor(Color.rgb(8,127,118));title.setGravity(Gravity.CENTER);
        root.addView(title);
        TextView subtitle = new TextView(this);
        subtitle.setText("Rehlat Sarfees Admin");subtitle.setTextSize(18);subtitle.setGravity(Gravity.CENTER);subtitle.setPadding(0,dp(8),0,dp(32));root.addView(subtitle);
        Button open = new Button(this);open.setText("فتح لوحة الإدارة");open.setTextSize(18);open.setOnClickListener(new View.OnClickListener(){ public void onClick(View v){openMap();} });
        root.addView(open,new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,dp(60)));
        status = new TextView(this);status.setText("لوحة إدارة متصلة بالإنترنت\nتفتح في نافذة متصفح مدمجة.\nسجّل الدخول باسم المستخدم وكلمة مرور الإدارة.");status.setTextSize(15);status.setGravity(Gravity.CENTER);status.setTextColor(Color.rgb(83,109,103));status.setPadding(0,dp(24),0,0);root.addView(status);
        setContentView(root);
        if (state == null) root.post(new Runnable(){public void run(){openMap();}});
    }
    private void openMap() {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(URL));
        // Public Custom Tabs protocol: a null session requests a standard, shared-cookie tab.
        Bundle extras = new Bundle();extras.putBinder("android.support.customtabs.extra.SESSION",null);intent.putExtras(extras);
        intent.putExtra("android.support.customtabs.extra.TOOLBAR_COLOR",Color.rgb(8,127,118));
        intent.putExtra("android.support.customtabs.extra.TITLE_VISIBILITY",1);
        intent.putExtra("android.support.customtabs.extra.ENABLE_URLBAR_HIDING",true);
        try {getPackageManager().getPackageInfo("com.android.chrome",0);intent.setPackage("com.android.chrome");} catch(PackageManager.NameNotFoundException ignored) {}
        try {startActivity(intent);} catch(ActivityNotFoundException failure) {
            intent.setPackage(null);
            try {startActivity(intent);} catch(ActivityNotFoundException noBrowser) {status.setText("لم نجد متصفحاً يدعم فتح التطبيق. ثبّت Chrome ثم اضغط فتح لوحة الإدارة.");}
        }
    }
}
