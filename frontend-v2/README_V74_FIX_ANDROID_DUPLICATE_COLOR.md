# Rivvo v7.4 — Fix Duplicate resources Android

Corrige el error:

```txt
Duplicate resources: color/ic_launcher_background
```

## Por qué pasa

Android ya tenía este recurso en:

```txt
android/app/src/main/res/values/ic_launcher_background.xml
```

y el parche anterior también lo añadió dentro de:

```txt
android/app/src/main/res/values/colors.xml
```

Por eso Gradle falla al generar el APK.

## Cómo aplicar

Desde `frontend-v2`:

```cmd
powershell -ExecutionPolicy Bypass -File .\fix_v74_duplicate_android_color.ps1
```

Luego:

```cmd
cd android
gradlew assembleDebug
```
