allprojects {
    repositories {
        // Prefer prefetched jars — dl.google.com has been unreliable on this network
        maven { url = uri("${rootDir}/local-maven") }
        google()
        mavenCentral()
        maven { url = uri("https://maven.aliyun.com/repository/google") }
        maven { url = uri("https://maven.aliyun.com/repository/central") }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

// Force compileSdk after each plugin's own android {} block (withPlugin runs too early).
subprojects {
    afterEvaluate {
        val android = extensions.findByName("android") ?: return@afterEvaluate
        try {
            val setCompileSdk = android.javaClass.methods.find { it.name == "setCompileSdkVersion" && it.parameterCount == 1 }
            setCompileSdk?.invoke(android, 36)
            val setCompileSdkInt = android.javaClass.methods.find { it.name == "setCompileSdk" && it.parameterTypes.contentEquals(arrayOf(Int::class.javaPrimitiveType)) }
            setCompileSdkInt?.invoke(android, 36)
            val getNs = android.javaClass.methods.find { it.name == "getNamespace" && it.parameterCount == 0 }
            val ns = getNs?.invoke(android) as String?
            if (ns.isNullOrBlank()) {
                val setNs = android.javaClass.methods.find { it.name == "setNamespace" && it.parameterCount == 1 }
                setNs?.invoke(android, "com.flutter.plugins.${project.name.replace("-", "_")}")
            }
        } catch (_: Exception) {
            // Best-effort for legacy plugins
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
