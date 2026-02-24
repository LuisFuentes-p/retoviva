# Servicios Adicionales - Documentación

## 📋 Descripción General
Página de servicios adicionales del flujo de compra (Paso 4/6). Permite a los pasajeros agregar servicios complementarios a su vuelo como equipaje, transporte, entretenimiento y mascotas.

## 🎯 Servicios Disponibles

### Equipaje
#### 1. **A Bordo (Incluido)**
- **Precio**: $0 (incluido en tarifa Zero)
- **Descripción**: Zero incluye un artículo personal
- **Requiere**: Solo para titular de tarjeta
- **Nota**: No incluye equipaje documentado

#### 2. **Documentado**
- **Precio**: $450-$550 (según destino)
- **Descripción**: Zero no incluye equipaje documentado
- **Capacidad**: 23 kg máximo
- **Requiere**: Solo para titular de tarjeta

---

### 🚗 Transporte

#### 1. **Uber**
- **Precio**: $420 MXN
- **Descripción**: Viaja desde y/o hacia el aeropuerto con Uber de manera rápida y cómoda
- **Cobertura**: Aeropuerto Internacional de Cancún
- **Ventajas**:
  - Pago integrado
  - Rastreo en tiempo real
  - Cancelación flexible
  - Tarifa fija

#### 2. **Viva Transfer**
- **Precio**: $350 MXN
- **Descripción**: Asegura tu transporte desde el aeropuerto hasta destino con nuestro servicio de traslado compartido
- **Tipo**: Traslado compartido
- **Ventajas**:
  - Económico
  - Seguro
  - Conductor profesional
  - Confirmación por SMS

#### 3. **Viva Bus**
- **Precio**: $280 MXN
- **Descripción**: Te transportaremos del aeropuerto a diferentes puntos de la ciudad de Cancún y de regreso
- **Tipo**: Autobús compartido
- **Rutas**: Múltiples paradas en la ciudad
- **Ventajas**:
  - Más económico
  - Gran capacidad
  - Horarios regulares
  - Estaciones establecidas

---

### 🎉 Entretenimiento & Servicios

#### 1. **Coco Bongo**
- **Precio**: $550 MXN
- **Descripción**: Disfruta de música en vivo, increíbles espectáculos y la mejor fiesta en Coco Bongo, Cancún
- **Ubicación**: Cancún, Quintana Roo
- **Incluye**:
  - Entrada general
  - Bar abierto
  - Shows en vivo
  - Ambiente VIP
- **Duración**: ~4 horas
- **Horario**: 21:00 - 02:00 hrs

#### 2. **Viva Express**
- **Precio**: $199 MXN
- **Descripción**: Pasa directo a nuestra fila express para documentar tu maleta
- **Beneficio**: Evita colas en check-in
- **Tiempo ahorrado**: ~15-30 minutos
- **Válido para**: Titular y 1 acompañante
- **Horario**: En la terminal, 2 horas antes del vuelo

---

### 🐾 Servicios de Mascotas

#### 1. **Mascota en Cabina**
- **Precio**: $450 MXN
- **Descripción**: Disfruta de la compañía de tu mascota llevándola contigo debajo del asiento que tengas enfrente
- **Requisitos**:
  - Peso máximo: 5 kg
  - Jaula de transporte incluida
  - Documentos de salud requeridos
- **Restricciones**: Máximo 2 mascotas por vuelo en cabina

#### 2. **Mascota en Carga**
- **Precio**: $299 MXN
- **Descripción**: Si tu perro pesa más de 12 kg, podemos transportarlo en una zona de carga especialmente habilitada para mascotas
- **Requisitos**:
  - Peso: 5-75 kg
  - Jaula/contenedor resistente
  - Certificado de salud
  - Vacunas al día
- **Condiciones**:
  - Temperatura controlada
  - Ventilación adecuada
  - Supervisión profesional

---

## 💳 Información de Precios

### Resumen por Categoría
| Categoría | Servicio | Precio | Aplica a |
|-----------|----------|--------|----------|
| **Equipaje** | A Bordo | $0 | Titular |
| **Equipaje** | Documentado | $450 | Titular |
| **Transporte** | Uber | $420 | Todos |
| **Transporte** | Viva Transfer | $350 | Todos |
| **Transporte** | Viva Bus | $280 | Todos |
| **Entretenimiento** | Coco Bongo | $550 | Todos |
| **Servicio** | Viva Express | $199 | Titular + 1 |
| **Mascotas** | En Cabina | $450 | Todos |
| **Mascotas** | En Carga | $299 | Todos |

---

## 🔄 Flujo de Selección

### Paso 1: Seleccionar Servicios
1. Revisar descripción de cada servicio
2. Ver precio en la esquina inferior derecha
3. Click en "Seleccionar" o directamente en la tarjeta
4. El servicio se resaltará en verde

### Paso 2: Revisar Resumen
- Panel dinámico muestra servicios seleccionados
- Total actualiza en tiempo real
- Deseleccionar es tan fácil como hacer click nuevamente

### Paso 3: Aceptar Términos
- Checkbox de "Acepto el ISO de mis datos personales..."
- Debe estar marcado para continuar
- Botón "Continuar" se activa solo si es validado

### Paso 4: Proceder
- Click en "Continuar" → Siguiente paso (Asientos)
- Arrow atrás → Volver a Pasajeros
- Los datos se guardan automáticamente en localStorage

---

## 🖥️ Características Técnicas

### Frontend
- **Framework**: HTML5 + CSS3 + JavaScript Vanilla
- **Storage**: localStorage (sesión de usuario)
- **Responsive**: Desktop 1440px + adaptación

### JavaScript API
```javascript
// Datos cargados automáticamente
const SERVICIOS = {
  'equipaje-a-bordo': { nombre: 'Equipaje a bordo', precio: 0 },
  'uber': { nombre: 'Uber', precio: 420 },
  // ... más servicios
}

// Uso
cargarDatos()        // Obtener selecciones guardadas
guardarDatos(datos)  // Persistir en localStorage
actualizarTotal()    // Recalcular total dinámico
```

### Storage Structure
```json
{
  "adicionales-selecciones": {
    "uber": true,
    "viva-bus": false,
    "mascota-cabina": true
  },
  "booking-data": {
    "adicionales": {...},
    "total": 870,
    "timestamp": 1708617600000
  }
}
```

---

## ✅ Validaciones

1. **Privacidad**: Debe estar aceptada para continuar
2. **Mascotas**: Máximo 2 por vuelo en cabina
3. **Documentación**: Verificación de datos pet si aplica
4. **Transporte**: Se ejecuta solo para titular en algunos casos

---

## 🎨 Estilos & Diseño

### Colores Viva
- Verde: #00ae42 (botones, destaque)
- Oscuro: #11301e (texto principal)
- Fondo claro: #eff7f1 (headers)
- Footer: #0a241b (verde oscuro)

### Interactividad
- Hover efectos en tarjetas
- Borde verde al seleccionar
- Total dinámico actualiza al instante
- Animaciones suaves (200ms)

---

## 📱 Responsive Breakpoints

- **Desktop**: 1440px+ (diseño original)
- **Tablet**: 768px - 1440px (ajustes)
- **Mobile**: < 768px (stack vertical)

---

## 🔗 Navegación

### Entrada
- Desde: `/informacion-del-pasajero/` (Paso 3)

### Salida
- Continuar: `/asientos/` (Paso 5)
- Atrás: `/informacion-del-pasajero/` (Paso 3)

---

## 📝 Notas para Desarrollo

### TODOs Futuros
- [ ] Integrar con API de precios en tiempo real
- [ ] Descuentos/promociones según destino
- [ ] Validaciones de disponibilidad de mascotas
- [ ] Confirmación de correo para servicios
- [ ] QR de confirmación de servicios

### Bugs Conocidos
- None currently tracked

### Performance
- Carga: < 1s
- Interactividad: < 100ms
- localStorage sync: Inmediato

---

**Última actualización**: Feb 2026  
**Versión**: 1.0 Funcional  
**Mantenedor**: Equipo Viva Aerobus
