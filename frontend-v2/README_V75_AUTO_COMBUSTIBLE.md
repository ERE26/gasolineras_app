# Rivvo v7.5 — Combustible automático en Buscar

Este parche cambia el comportamiento de `/buscar`:

- Si cambias Gasolina 95, Gasolina 98, Diésel o Diésel premium, se actualizan los resultados directamente.
- Si cambias GLP, GNC, GNL o Hidrógeno, también se actualiza directamente.
- Ya no necesitas pulsar `Aplicar filtros` para que cambie el combustible.
- Si eliges un vehículo guardado, también aplica automáticamente el combustible de ese vehículo.

## Cómo aplicar

Desde `frontend-v2`:

```cmd
powershell -ExecutionPolicy Bypass -File .\apply_v75_auto_combustible_buscar.ps1
```

Luego:

```cmd
npm run build
```

## Cómo probar

Entra en:

```txt
/buscar
```

Haz una búsqueda y cambia el combustible. Los resultados deberían recalcularse solos.
