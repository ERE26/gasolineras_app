# Rivvo v7.0 — Planifica viaje reconoce vehículos guardados

Este parche corrige el fallo de `/planificar-viaje`:

- Si el usuario ha iniciado sesión, carga los vehículos desde Supabase.
- Si no hay sesión, mantiene el fallback de `localStorage`.
- Si encuentra vehículos guardados, selecciona automáticamente el primero.
- En opciones ya no aparece “Añadir vehículo” si el usuario sí tiene coches guardados en su cuenta.

## Archivo modificado

```txt
frontend-v2/app/planificar-viaje/page.tsx
```

## Cómo probar

```cmd
cd /d "C:\Users\eduar\Downloads\gasolineras_app(5)\gasolineras_app\frontend-v2"

npm run build
```

Luego entra con tu cuenta y prueba:

```txt
/planificar-viaje → Opciones → Vehículo
```

Deberían aparecer tus vehículos guardados.
