# Actividades del bebé

## Objetivo
Desarrollar el Tab 2 de la app para registrar, listar, editar y eliminar actividades del bebé, con miras a sincronización futura entre dispositivos.

## Importante
- No modificar el Tab 1 llamado "Mi Bebé".
- No tocar la pantalla principal actual.

## Alcance
En el Tab 2 se debe permitir:

- Registrar una nueva actividad.
- Listar actividades del día actual.
- Editar y eliminar actividades existentes.
- Agrupar/listar actividades por categoría.
- Mostrar las actividades en orden descendente por hora.

## Tipos de actividad

### 1. Toma de leche
Campos:
- Hora
- Cantidad en onzas
- Es leche materna: booleano, por defecto `false`

### 2. Cambio de pañal
Campos:
- Hora
- Tiene heces fecales: booleano, por defecto `false`

## Persistencia
Se utiliza **Capacitor Preferences** para almacenamiento local, con estructura preparada para futura sincronización en la nube.

## Comportamiento
- Al crear, editar o eliminar una actividad, debe guardarse localmente.
- Al volver al Tab 2, deben cargarse las actividades guardadas.
- Solo deben mostrarse las actividades del día actual.
- Las actividades deben mostrarse de más reciente a más antigua.
- Deben separarse o identificarse por categoría:
  - Tomas de leche
  - Cambios de pañal

## UI / Diseño
- Usar componentes Ionic.
- Diseño mobile-first.
- Formulario claro para agregar y editar actividad.
- Lista clara de actividades registradas.
- Botones para editar y eliminar cada actividad.
- Mostrar estado vacío si no hay actividades del día.
- Seguir el diseño visual actual de los tabs.

## Reglas técnicas
- Usar Angular standalone si el proyecto ya lo usa.
- Crear modelos/interfaces para las actividades.
- Crear service para manejar la persistencia.
- No duplicar lógica en componentes.
- No agregar backend.
- No agregar login.
- No modificar Tab 1 "Mi Bebé".
- No cambiar arquitectura sin aprobación.
- Crear tests unitarios para service y modelos.

## Archivos esperados
El agente debe proponer los archivos exactos antes de modificar código.

Archivos creados/modificados:
- src/app/models/activity.model.ts
- src/app/models/activity.model.spec.ts
- src/app/services/activity.service.ts
- src/app/services/activity.service.spec.ts
- src/app/tab2/tab2.page.ts
- src/app/tab2/tab2.page.html
- src/app/tab2/tab2.page.scss

## Estado
En desarrollo (persistencia, edición y eliminación implementadas; UI en progreso)