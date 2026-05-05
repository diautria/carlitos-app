# Proyecto

Aplicación móvil desarrollada con Ionic Angular.

## Objetivo
Crear una app moderna, rápida y mantenible.

## Tecnologías
- Ionic
- Angular standalone
- TypeScript

## Reglas generales
- Código limpio
- Tipado fuerte
- Componentes reutilizables
- Mobile first

# Metodología de trabajo con IA

Este proyecto se desarrolla usando Spec-Driven Development con Copilot Agent.

## Reglas obligatorias para el agente

Antes de escribir o modificar código, el agente debe:

1. Leer la carpeta `docs`.
2. Entender la funcionalidad solicitada.
3. Hacer preguntas si hay dudas.
4. Proponer un plan de implementación.
5. Listar los archivos que va a crear o modificar.
6. Esperar aprobación explícita del usuario antes de aplicar cambios.

## El agente NO debe

- Modificar código sin aprobación.
- Crear funcionalidades no solicitadas.
- Cambiar arquitectura sin justificarlo.
- Romper lo existente.
- Agregar librerías sin pedir permiso.
- Inventar backend, login o autenticación si no se pidió.

## Después de implementar

El agente debe:

1. Explicar qué cambió.
2. Indicar cómo probarlo.
3. Actualizar la documentación de la funcionalidad correspondiente.
4. Registrar decisiones nuevas en `docs/decisions.md` si corresponde.