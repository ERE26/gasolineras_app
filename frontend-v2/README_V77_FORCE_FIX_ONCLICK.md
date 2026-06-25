# Rivvo v7.7 — Fix forzado onClick loadManualRanking

Este parche corrige de forma forzada todas las apariciones de:

```tsx
onClick={loadManualRanking}
```

por:

```tsx
onClick={() => void loadManualRanking()}
```

## Cómo aplicar

Desde `frontend-v2`:

```cmd
powershell -ExecutionPolicy Bypass -File .\apply_v77_force_fix_onclick.ps1
npm run build
```

Si compila:

```cmd
cd ..
git add .
git commit -m "Corregir onClick de aplicar filtros"
git push
```
