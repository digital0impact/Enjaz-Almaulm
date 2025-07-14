const { getDefaultConfig } = require('expo/metro-config');

module.exports = {
  expo: {
    name: "enjaz-almualm",
    slug: "teacher-performance-app",
    owner: "amalshaman",
    version: "1.0.7",
    orientation: "portrait",
    icon: "./assets/images/Logo.png",
    scheme: "enjazalmualm",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    locales: {
      ar: "./assets/locales/ar.json"
    },
    primaryLanguage: "ar",
    extra: {
      router: {},
      supabaseUrl: "YOUR_SUPABASE_URL",
      supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
      eas: {
        projectId: "e1a21878-53e7-4976-9884-6206e56653c3"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.teacherperformance.tdp",
      buildNumber: "2",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "يحتاج التطبيق للوصول للكاميرا لالتقاط الصور",
        NSPhotoLibraryUsageDescription: "يحتاج التطبيق للوصول لمكتبة الصور لرفع الملفات",
        NSPhotoLibraryAddUsageDescription: "يحتاج التطبيق لحفظ الصور في مكتبة الصور",
        UILaunchStoryboardName: "SplashScreen",
        CFBundleURLTypes: [
          {
            CFBundleURLName: "auth",
            CFBundleURLSchemes: [
              "enjazalmualm"
            ]
          }
        ]
      },
      config: {
        usesNonExemptEncryption: false
      },
      inAppPurchases: [
        "com.enjazalmualm.subscription.yearly",
        "com.enjazalmualm.subscription.halfyearly"
      ]
    },
    android: {
      package: "com.enjazalmualm.teacherperformance",
      versionCode: 39,
      adaptiveIcon: {
        foregroundImage: "./assets/images/Logo.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "com.android.vending.BILLING",
        "android.permission.RECORD_AUDIO"
      ],

      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "enjazalmualm"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ],
      allowBackup: true,
      enableProguardInReleaseBuilds: true,
      enableShrinkResourcesInReleaseBuilds: true,
      supportsRtl: true,
      softwareKeyboardLayoutMode: "pan",
      buildConfigFields: {
        STORE: '"play"'
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/Logo.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/Logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "يحتاج التطبيق للوصول لمكتبة الصور لرفع الملفات",
          cameraPermission: "يحتاج التطبيق للوصول للكاميرا لالتقاط الصور"
        }
      ],
      [
        "react-native-iap",
        {
          store: "play"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/409190b4-990f-426b-939f-2d3922e5f30a"
    }
  }
}; 