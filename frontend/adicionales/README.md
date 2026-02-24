# Guía Técnica - Página Adicionales

## 📐 Arquitectura

### Estructura de Archivos
```
frontend/adicionales/
├── index.html          # Estructura HTML con servicios
├── style.css           # Estilos diseño + responsive
├── SERVICIOS.md        # Documentación de servicios
└── README.md           # Esta guía
```

### Componentes Principales

#### 1. Headers (global.css + style.css)
```html
<header class="top-header">       <!-- Logo, navegación superior -->
<header class="main-header">      <!-- Brand + acciones -->
<div class="viva-progress-bar">   <!-- Barra progreso paso 4/6 -->
```

#### 2. Contenido Principal
```html
<div class="adicionales">         <!-- Contenedor absoluto-positioned -->
  <div class="servicios-X">       <!-- Secciones de servicios -->
  <div class="uber/coco-bongo/etc"> <!-- Tarjetas individuales -->
</div>
```

#### 3. Footer (Relleno)
```html
<div class="relleno">
  <div class="resumen-servicios">   <!-- Resumen dinámico NUEVO -->
  <div class="privacidad">          <!-- Aceptación de términos -->
  <div class="overlap-group">       <!-- Info + imagen decorativa -->
</div>
```

---

## 🔧 Funcionalidad JavaScript

### Inicialización
```javascript
// Al cargar la página:
1. DOMContentLoaded → inicializarCheckboxes()
2. Restaura selecciones previas del localStorage
3. Calcula e imprime total dinámico
4. Valida checkbox de privacidad
```

### Flujos Principales

#### A. Seleccionar/Deseleccionar Servicio
```javascript
Usuario hace click en tarjeta
  ↓
Event listener captura click
  ↓
Encuentra checkbox asociado
  ↓
Toggle checked property
  ↓
dispatchEvent('change')
  ↓
Guardar en localStorage
  ↓
actualizarTotal() + actualizarResumen()
```

#### B. Calcular Total
```javascript
actualizarTotal()
  ├─ Obtiene datos de localStorage
  ├─ Itera servicios seleccionados
  ├─ Suma precios: $0 + $420 + $450 = $870
  ├─ Actualiza elementos DOM:
  │  ├─ #total-servicios
  │  ├─ #resumen-items (lista)
  │  └─ #subtotal
  └─ Retorna valor numérico
```

#### C. Navegar
```javascript
// Continuar → /asientos/
Click .continuar
  ├─ Valida privacidad checkbox
  ├─ Guarda en localStorage:
  │  ├─ adicionales-selecciones
  │  └─ booking-data (alias con total)
  └─ window.location.href = '/asientos/'

// Atrás → /informacion-del-pasajero/
Click .regreso / .flecha-pequena
  └─ window.location.href = '/informacion-del-pasajero/'
```

---

## 💾 localStorage Schema

### Clave: `adicionales-selecciones`
```javascript
{
  "equipaje-a-bordo": false,
  "uber": true,
  "cocobongo": false,
  "viva-express": true,
  "viva-transfer": false,
  "mascota-carga": false,
  "viva-bus": false,
  "mascota-cabina": true,
  "privacidad": true
}
```

### Clave: `booking-data`
```javascript
{
  "adicionales": {
    "uber": true,
    "mascota-cabina": true
  },
  "total": 870,
  "timestamp": 1708617600000
}
```

---

## 🎨 CSS Architecture

### Variables (global.css)
```css
--viva-green: #00ae42
--viva-dark: #11301e
--viva-text: #303030
--viva-muted: #757575
--viva-line: #d4d4d4
--viva-bg-light: #f6fbf7
```

### Breakpoints
```css
Desktop:  1440px+ (diseño original absoluto-positioned)
Tablet:   768px - 1440px (overflow-x auto)
Mobile:   < 768px (stack vertical)
```

### Estados CSS
```css
.servicio-checkbox:checked + .rectangle {
  border: 3px solid #00ae42;              /* Verde en seleccionado */
  background-color: rgba(0, 174, 66, 0.05);  /* Fondo suave */
}

.servicio:hover .rectangle {
  border-color: #00ae42;                  /* Verde al hover */
}

.rectangle:hover {
  background-color: #068a38;              /* Verde oscuro en botón */
}
```

---

## 🚀 Cómo Extender

### Agregar Nuevo Servicio

#### 1. Actualizar `SERVICIOS` en JavaScript
```javascript
const SERVICIOS = {
  // ... existentes
  'mi-servicio': { 
    nombre: 'Mi Nuevo Servicio', 
    precio: 250 
  }
}
```

#### 2. Agregar HTML (mantener estructura)
```html
<div class="mi-servicio">
  <input type="checkbox" data-service="mi-servicio" />
  <div class="rectangle-XX"></div>
  <!-- Contenido similar a otros -->
</div>
```

#### 3. Agregar CSS (si es necesario)
```css
.mi-servicio .rectangle-XX {
  width: 435px;
  height: 337px;
  border-radius: 20px;
  border: 1px solid #000000;
}
```

#### 4. Documentar en SERVICIOS.md

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Cargar servicios desde localStorage
- [ ] Guardar servicios a localStorage
- [ ] Calcular total correctamente
- [ ] Validar checkboxes marcan/desmarcan
- [ ] Total actualiza en tiempo real

### Integration Tests
- [ ] Click en tarjeta selecciona checkbox
- [ ] Resumen actualiza al seleccionar
- [ ] Privacidad desactiva botón continuar
- [ ] Navegación funciona (continuar/atrás)
- [ ] Datos persisten al recargar

### Visual Tests
- [ ] Headers se ven correctamente
- [ ] Barra progreso muestra paso 4
- [ ] Tarjetas se alinean bien
- [ ] Resumen es legible
- [ ] Footer está intacto

### Responsive Tests
- [ ] Desktop 1440px ✓
- [ ] Tablet 768px (scroll)
- [ ] Mobile 375px (scroll)

---

## 📊 Performance

### Métricas
- HTML: ~250 líneas
- CSS: ~1390 líneas
- JavaScript: ~270 líneas (inline)
- Tamaño total: ~45 KB

### Optimizaciones Implementadas
- ✅ localStorage en lugar de API para sesión
- ✅ CSS sin frameworks (vanilla)
- ✅ JavaScript vanilla (sin dependencias)
- ✅ Event delegation (1 listener)
- ✅ Cálculos dinámicos (sin re-renders innecesarios)

### Potenciales Mejoras
- [ ] Lazy loading de imágenes
- [ ] Code splitting (CSS modular)
- [ ] Minificación de assets
- [ ] Service Worker para offline

---

## 🔐 Seguridad

### Validaciones
- ✅ Privacidad requerida antes de continuar
- ✅ localStorage local (no sensible)
- ✅ Sin comunicación externa (hasta backend)
- ✅ XSS prevention (sin eval)

### TODO: Integración Backend
```javascript
// Cuando haya backend API:
async function guardarAdicionalesAlServidor() {
  const datos = cargarDatos();
  const response = await fetch('/api/booking/adicionales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return response.json();
}
```

---

## 🐛 Troubleshooting

### Problema: Total no actualiza
**Solución**: Verificar que el ID del elemento sea correcto
```javascript
// Verificar en consola:
console.log(document.querySelector('#total-servicios'))
```

### Problema: Checkboxes no guardan
**Solución**: Verificar localStorage
```javascript
// En consola:
JSON.parse(localStorage.getItem('adicionales-selecciones'))
```

### Problema: CSS no aplica
**Solución**: Verificar cascada
```css
/* Asegurarse que .servicio-checkbox:checked sea más específico */
.servicio-checkbox:checked + .rectangle { /* ✓ Correcto */ }
.rectangle { /* ✗ Menos específico */ }
```

---

## 📖 Referencias

### Archivos Relacionados
- `/assets/css/global.css` - Estilos globales (headers, barra)
- `/informacion-del-pasajero/` - Paso anterior
- `/asientos/` - Paso siguiente

### Documentación Externa
- [localStorage MDN](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage)
- [CSS Position](https://developer.mozilla.org/es/docs/Web/CSS/position)
- [Responsive Design](https://developer.mozilla.org/es/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

**Versión**: 1.0  
**Última actualización**: Feb 2026  
**Estado**: ✅ Funcional en producción
