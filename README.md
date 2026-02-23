# Reto Viva

Reto de Innovation Meetup 2026.

## Contexto del proyecto

El proyecto se basará en el sitio existente de Viva Aerobus, manteniendo su enfoque principal en la búsqueda y compra de vuelos de forma rápida y accesible. La experiencia actual del sitio prioriza:

- Consulta de vuelos por origen, destino y fechas.
- Presentación clara de precios y disponibilidad.
- Flujo de reserva con selección de servicios adicionales.
- Diseño orientado a conversión, con llamadas a la acción visibles.

Sobre esta base, se desarrollarán mejoras de funcionalidad y experiencia de usuario.

## Pantallas del sitio web

Las definiciones de pantallas se movieron a [pantallas.txt](pantallas.txt).

## Funcionalidades añadidas (pendiente de definir)

-
-
-

## Generación de pantallas desde input

Cuando agregues o actualices pantallas dentro de `input/`, puedes generar su versión en `frontend/` con un `style.css` por pantalla y `global.css` compartido ejecutando:

- `npm run generate:screens`

Si PowerShell bloquea `npm` por políticas de ejecución, usa:

- `node scripts/generate-screens.js`
