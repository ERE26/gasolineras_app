# Rivvo v8.4 — Entrar cambia a Mi cuenta + nuevo perfil

## Cambios

- Si hay sesión iniciada, el botón de la barra superior cambia de `Entrar` a `Mi cuenta`.
- Si no hay sesión, sigue saliendo `Entrar`.
- `/perfil` pasa a ser un panel de cuenta más completo.
- Añade sección `Mis datos`.
- Mantiene los accesos a vehículos y favoritas.
- Al cerrar sesión limpia datos privados locales.

## Aplicación

Copia/reemplaza estos archivos:

- `frontend-v2/app/components/TopNav.tsx`
- `frontend-v2/app/perfil/page.tsx`

Después ejecuta:

```cmd
cd /d "C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app\frontend-v2"
npm run build
```
