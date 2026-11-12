# Empleos Ceres en Red — MVP Employer

Fecha: 2026-11-12  
Estado: aprobado para implementación

## Objetivo

Sumar a Ceres en Red una bolsa de trabajo local: empresas/privados registrados publican vacantes; vecinos ven el aviso y contactan por fuera (mail/teléfono). Sin CVs en nuestro servidor.

## Alcance MVP

Incluye:
- Rol `employer` + perfil `Employer`
- Registro de empresa con datos básicos + logo obligatorio
- Publicación con formato fijo
- Listado/detalle público `/empleos`
- Panel empresa para gestionar avisos
- Baja administrativa (`taken_down`) sin moderación previa

No incluye (después):
- Postulación interna / carga de CVs
- Feed social tipo LinkedIn
- Publicación cargada por muni en nombre de terceros (sí pueden usar cuenta employer o admin API)

## Decisiones

- Publicación **directa** si la empresa está registrada
- Contacto CV: mail y/o teléfono (mínimo 1)
- Admin puede dar de baja en cualquier momento

## Modelo de datos

### `UserRole`

Agregar `employer`.

### `Employer`

- `userId` (unique)
- `companyName`
- `taxId` + `taxIdType` (`cuit` | `dni`)
- `phone`
- `logoUrl` (obligatorio)
- `createdAt` / `updatedAt`

### `JobPost`

- `employerId`
- `companyName` (obligatorio en el aviso)
- `title` (vacante)
- `searchStartsAt` / `searchEndsAt`
- `requirements`
- `contactEmail?` / `contactPhone?` (al menos uno)
- `status`: `active` | `closed` | `taken_down`
- `takenDownAt?` / `takenDownReason?`

## Flujos

1. Registro empresa → user `employer` + `Employer` + verificación de email
2. Login → panel `/dashboard/empleos`
3. Crear aviso → sale `active` al instante
4. Público ve solo `active` dentro del período
5. Admin API: `taken_down`

## APIs

- `POST /api/auth/register-employer`
- `GET/POST /api/employer/job-posts`
- `PATCH/DELETE /api/employer/job-posts/[id]`
- `GET /api/empleos` / `GET /api/empleos/[id]`
- `POST /api/admin/job-posts/[id]/take-down`

## UI

- `/auth/registro-empresa`
- `/empleos` + `/empleos/[id]`
- `/dashboard/empleos` (+ crear/editar)
- Link “Empleos” en header + CTA registro empresa
