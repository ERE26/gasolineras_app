# Rivvo móvil con Capacitor

La web normal se despliega en Vercel con:

```cmd
npm run build
```

La versión móvil para Capacitor se genera en carpeta `out` con:

```cmd
npm run build:mobile
```

## Instalar dependencias

```cmd
cd /d "C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app\frontend-v2"

npm install
```

## Añadir Android

```cmd
npx cap add android
```

## Build web y copiar a Android

```cmd
npm run build:mobile
npx cap sync android
```

## Abrir Android Studio

```cmd
npx cap open android
```

## iOS

Para iOS necesitarás Mac con Xcode:

```bash
npm install @capacitor/ios
npx cap add ios
npm run build:mobile
npx cap sync ios
npx cap open ios
```

## Importante

- `npm run build` es para Vercel.
- `npm run build:mobile` es para Capacitor y genera la carpeta `out`.
- No subas carpetas pesadas como `android`, `ios`, `.next` u `out` hasta que decidamos cómo organizarlo en Git.
