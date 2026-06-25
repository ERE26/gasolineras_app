# Rivvo móvil con Capacitor

Rivvo usa rutas API de Next (`/api/address-suggest`, `/api/trip-plan`, etc.). Por eso NO usamos `output: "export"` para Capacitor: una exportación estática rompe esas rutas.

La app Android de Capacitor cargará la web desplegada en Vercel:

```txt
https://gasolineras-app-mu.vercel.app
```

## Flujo correcto

### 1. Comprobar que la web compila

```cmd
cd /d "C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app\frontend-v2"

npm run build
```

### 2. Añadir Android si todavía no existe

```cmd
npx cap add android
```

### 3. Sincronizar Android

```cmd
npm run build:mobile
npx cap sync android
```

### 4. Abrir Android Studio

```cmd
npx cap open android
```

## Importante

- `npm run build:mobile` ahora hace `next build`, no exportación estática.
- La app nativa cargará la URL de producción.
- Antes de subir a tiendas hay que tener dominio definitivo, política de privacidad y permisos de ubicación bien explicados.
- Cuando tengamos dominio propio, cambiaremos `server.url` en `capacitor.config.ts`.
