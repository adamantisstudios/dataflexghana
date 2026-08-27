plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.dataflexghana.agent_mobile"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.dataflexghana.agent_mobile"
        minSdk = maxOf(24, flutter.minSdkVersion)
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

// google_mlkit_face_detection depends on com.google.mlkit:face-detection, which
// bundles the ~16MB model into the APK. The Play Services build exposes the same
// com.google.mlkit.vision.face API but fetches the model on demand, so the APK
// stays small. This app is sideloaded, which is unaffected: the unbundled model
// needs Play Services on the device, not Play Store distribution. Devices without
// Play Services simply fail detection, and the selfie falls back to admin review.
configurations.configureEach {
    exclude(group = "com.google.mlkit", module = "face-detection")
}

dependencies {
    implementation("com.google.android.gms:play-services-mlkit-face-detection:17.1.0")
}

flutter {
    source = "../.."
}
