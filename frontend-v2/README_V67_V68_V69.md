# Rivvo v6.7 + v6.8 + v6.9 pack

Este pack añade cosas seguras sin tocar archivos delicados existentes:

## v6.7 Onboarding

Añade:

```txt
/onboarding
```

Archivo:

```txt
frontend-v2/app/onboarding/page.tsx
```

## v6.8 Google Play listing

Añade textos para preparar la ficha de Google Play:

```txt
frontend-v2/docs/GOOGLE_PLAY_LISTING.md
```

## v6.9 Guía AAB firmado

Añade guía para generar el archivo de subida a Google Play:

```txt
frontend-v2/docs/GENERAR_AAB_FIRMADO.md
```

## Cómo probar

```cmd
cd /d "C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app\frontend-v2"

npm run build
```

Luego puedes abrir:

```txt
/onboarding
```

## Nota importante

Este pack NO genera el AAB firmado porque eso tiene que hacerse en tu Android Studio con una clave privada local.
No subas nunca el archivo `.jks` a GitHub.
