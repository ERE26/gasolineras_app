# Rivvo v7.9 — Fix fuerte de textos corruptos

Este parche repara textos tipo:

```txt
DÃ³nde -> Dónde
ubicaciÃ³n -> ubicación
DiÃ©sel -> Diésel
vehÃ­culos -> vehículos
MÃ¡s -> Más
bÃºsqueda -> búsqueda
```

A diferencia del anterior, este intenta reparar tokens corruptos de forma más general y además te imprime las líneas que sigan sospechosas.

## Cómo aplicar

Desde `frontend-v2`:

```cmd
node fix_v79_encoding_deep.js
npm run build
```

## Después

Si compila y se ve bien:

```cmd
cd ..
git add .
git commit -m "Corregir textos corruptos definitivamente"
git push
```

## Importante

Si el script imprime `REVISA ...`, pega esas líneas para corregirlas a mano.
