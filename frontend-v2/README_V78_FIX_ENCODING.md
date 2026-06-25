# Rivvo v7.8 — Fix textos corruptos

Este parche arregla textos tipo:

```txt
ubicaciÃ³n → ubicación
DiÃ©sel → Diésel
vehÃ­culos → vehículos
MÃ¡s → Más
bÃºsqueda → búsqueda
```

El problema vino de editar `page.tsx` con PowerShell sin preservar bien UTF-8.

## Cómo aplicar

Desde `frontend-v2`:

```cmd
node fix_v78_text_encoding_mojibake.js
npm run build
```

Si compila:

```cmd
cd ..
git add .
git commit -m "Corregir codificacion de textos"
git push
```

## Importante

Para próximos parches, mejor usar scripts Node/Python o editar con VS Code en UTF-8.
