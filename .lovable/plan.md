# Plan: Conectar Supabase + App Dashboard

## Objetivo
Conectar tu cuenta de Supabase al proyecto y construir una app web con dashboard.

## Paso 0 — Conectar tu Supabase (acción tuya, 5 min)

1. Crear cuenta/proyecto en [supabase.com](https://supabase.com):
   - **New project** → nombre, contraseña de BD (guárdala), región cercana (ej. West EU)
2. Conectar a Lovable:
   - **Project Settings → Connectors → Supabase** → iniciar sesión con la misma cuenta → seleccionar tu proyecto
3. Avisarme en el chat cuando esté hecho ("ya lo conecté") — verificaré la conexión desde aquí antes de tocar código.

*Alternativa si prefieres cero pasos externos: activo Lovable Cloud (backend integrado) y seguimos igual.*

## Paso 1 — Base del dashboard (cuando la conexión esté lista)

Al no especificar dominio, parto de un **CRM de ventas básico** (fácil de adaptar a cualquier dominio después):

1. **Esquema de base de datos** en tu Supabase:
   - `clients` (nombre, email, teléfono, notas)
   - `deals` (título, valor, estado: nuevo/en curso/ganado/perdido, cliente asociado)
   - RLS activado y políticas por usuario
2. **Autenticación**: login con email/contraseña, rutas protegidas
3. **Dashboard**:
   - Resumen con métricas (clientes totales, valor del pipeline, tratos ganados)
   - Lista y gestión de clientes (crear, editar, eliminar)
   - Lista y gestión de tratos con cambio de estado
   - Diseño limpio tipo panel de administración, en español

## Paso 2 — Ajustes

Con algo funcionando, me dices qué gestionará realmente tu negocio y adapto tablas, pantallas y métricas a tu caso.

## Notas técnicas
- TanStack Start + server functions para toda la lectura/escritura de datos
- El esquema se creará con migraciones SQL (tablas + GRANTs + RLS) en tu Supabase
