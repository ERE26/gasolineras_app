# Rivvo v8.1 — Cerrar sesión limpia vehículos y favoritas locales

Este parche corrige el comportamiento raro de que, después de cerrar sesión, Rivvo siga mostrando vehículos o favoritas como si el usuario estuviera dentro de su cuenta.

## Qué hace

- Al cerrar sesión borra cachés privadas de `localStorage`.
- Si no hay sesión, `/mis-vehiculos` ya no muestra vehículos antiguos guardados localmente.
- Si no hay sesión, `/favoritas` ya no muestra favoritas antiguas guardadas localmente.
- En `/buscar`, si no hay sesión, intenta limpiar restos privados de vehículos/favoritas.
- No borra `lastUserLocation`, porque eso solo sirve para ubicación reciente y no es dato de cuenta.

## Cómo aplicar

Desde `frontend-v2`:

```cmd
node apply_v81_logout_clear_private_cache.js
npm run build
```

## Después

```cmd
cd ..
git add .
git commit -m "Limpiar datos privados al cerrar sesion"
git push
```

## Cómo probar

1. Entra con tu cuenta.
2. Comprueba que ves vehículos y favoritas.
3. Cierra sesión desde Perfil.
4. Entra en `/mis-vehiculos`, `/favoritas` y `/buscar`.
5. No deberían aparecer vehículos ni favoritas de la cuenta hasta volver a iniciar sesión.
