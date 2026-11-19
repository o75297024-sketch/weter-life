# AGENTS.md — AguaRecordatorio

Este proyecto usa **OpenSpec** (desarrollo guiado por especificaciones / SDD).

## Flujo de trabajo obligatorio

1. **Explorar** ideas o dudas con `/opsx-explore`.
2. **Proponer** un cambio con `/opsx-propose "<idea>"`. Genera `proposal.md`, `specs/**/spec.md` (delta), `design.md` y `tasks.md` dentro de `openspec/changes/<cambio>/`.
3. **Implementar** solo cuando el usuario lo pida explícitamente, con `/opsx-apply`.
4. **Sincronizar** especificaciones con `/opsx-sync` si hace falta sin archivar.
5. **Archivar** el cambio terminado con `/opsx-archive`; los deltas pasan a `openspec/specs/`.

Reglas duras:

- La planificación no modifica código; la implementación no modifica la propuesta sin pasar por `/opsx-update`.
- Antes de cerrar cualquier implementación: `npx openspec validate --all`.
- Los artefactos se escriben en español; los encabezados y SHALL/MUST se mantienen en inglés.
- `documentos/` es la fuente de verdad funcional: no se edita sin un cambio propuesto.

## Contexto del proyecto

- PWA de recordatorios de hidratación: HTML5 + CSS3 + JS ES6+ (frontend), Node.js + Express (backend), SQLite3 (persistencia).
- Reglas de negocio: meta = `peso_kg * 35` ml (RN-01); volumen por toma según vigilia e intervalo (RN-02); día cumplido con ≥80% de la meta (RN-03).
- Estructura objetivo: `src/frontend/` y `src/backend/` (ver `documentos/est_ndar_de_desarrollo (1).md`).
- Detalle completo del contexto y reglas: `openspec/config.yaml`.

## Convenciones

- `const`/`let` únicamente, `async/await`, `try/catch` obligatorio, sentencias SQL preparadas.
- CSS con BEM y colores solo vía variables globales.
- Commits: `tipo: descripción corta en presente y minúsculas`.

## Comandos

```bash
npx openspec list                 # cambios activos y capacidades
npx openspec validate --all       # validar especificaciones y cambios
npx openspec view                 # ver el dashboard de OpenSpec
npx openspec update               # refrescar archivos generados en .opencode/
```

## Skills y comandos disponibles

Se generaron en `.agents/` (Antigravity) y `.opencode/`: `opsx-propose`, `opsx-apply`, `opsx-archive`, `opsx-explore`, `opsx-sync`, `opsx-update`.
*Nota para Windows:* si PowerShell restringe scripts `.ps1`, ejecutar los comandos con `npx.cmd openspec ...`.
