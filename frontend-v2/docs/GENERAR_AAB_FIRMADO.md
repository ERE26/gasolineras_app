# Rivvo — Generar AAB firmado

Este paso se hace cuando Android Studio ya abre bien el proyecto.

## En Android Studio

1. Abre el proyecto Android con:

```cmd
npx cap open android
```

2. En Android Studio:

```txt
Build → Generate Signed Bundle / APK
```

3. Elige:

```txt
Android App Bundle
```

4. Crea una clave nueva si todavía no tienes una.

Guarda muy bien:
- Archivo `.jks`
- Alias
- Contraseña de la clave
- Contraseña del keystore

Sin eso no podrás actualizar la app en Google Play.

## Recomendación de ruta local

```txt
C:\Users\eduar\Documents\rivvo-release-key.jks
```

No subas el `.jks` a GitHub.

## Después

Android Studio generará un archivo `.aab`, que es el que se sube a Google Play Console.
