# Rivvo v6.5 — Android icono, splash y permisos

Este parche añade:

- Iconos Android de Rivvo.
- Nombre visible: Rivvo.
- Colores nativos.
- Imagen splash.
- Permisos Android de ubicación.

## Cómo aplicarlo

Copia el contenido del ZIP en:

```txt
C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app
```

Después ejecuta:

```cmd
cd /d "C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app\frontend-v2"

powershell -ExecutionPolicy Bypass -File .\apply_v65_android_assets.ps1

npm run build:mobile
npx cap sync android
```

Luego abre Android Studio:

```cmd
npx cap open android
```

## Importante

No ejecutes otra vez `npx cap add android`, porque Android ya existe.
