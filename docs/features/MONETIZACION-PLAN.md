

Read [](file:///e%3A/bebecitoApp/docs)

Fetched [resource](file:///e:/bebecitoApp/docs)

Read memory [](file:///c%3A/Users/Jos%C3%A9%20Carlos/AppData/Roaming/Code/User/workspaceStorage/9afba9e037a5e081d868c7238ece41f7/GitHub.copilot-chat/memory-tool/memories/MzczNGI3ZTktMjllYy00YTcyLWE0MmMtZTkzZTcyZjdlYWRi/plan.md)

Read memory [](file:///c%3A/Users/Jos%C3%A9%20Carlos/AppData/Roaming/Code/User/workspaceStorage/9afba9e037a5e081d868c7238ece41f7/GitHub.copilot-chat/memory-tool/memories/MzczNGI3ZTktMjllYy00YTcyLWE0MmMtZTkzZTcyZjdlYWRi/plan.md)

Read memory [](file:///c%3A/Users/Jos%C3%A9%20Carlos/AppData/Roaming/Code/User/workspaceStorage/9afba9e037a5e081d868c7238ece41f7/GitHub.copilot-chat/memory-tool/memories/MzczNGI3ZTktMjllYy00YTcyLWE0MmMtZTkzZTcyZjdlYWRi/plan.md)

Voy a crear un archivo markdown limpio y estructurado en la carpeta de documentación del proyecto: 

Read [](file:///e%3A/bebecitoApp/docs/project-context.md#1-1), lines 1 to 30

Voy a crear un archivo markdown completo y claro en la carpeta docs. Como no tengo herramienta para crear archivos directamente, te muestro el contenido formateado listo para copiar:

```markdown
# 📱 Plan: Sistema de Suscripción Freemium - BebecioApp

**Fecha**: 3 Junio 2026  
**Estado**: ✅ APROBADO  
**Precio**: $1.00/mes  

---

## 🎯 TL;DR - Resumen Ejecutivo

Implementar modelo **Freemium** con:
- **Plan Free** → 1 bebé, notificaciones, tema LIGHT forzado (no sigue sistema)
- **Plan Premium** → 10 bebés, medicamentos, estadísticas, tema libre ($1.00/mes)
- **Plataforma**: Google Play Billing (Android) + Stripe (Web)

---

## 📊 Tabla Comparativa de Planes

| Característica | Free | Premium |
|---|---|---|
| **Bebés** | 1 | 10 |
| **Medicamentos** | ❌ Bloqueado | ✅ |
| **Estadísticas gráficas** | ❌ | ✅ |
| **Tema oscuro** | ❌ (FORZADO LIGHT) | ✅ Libre |
| **Notificaciones** | ✅ | ✅ |
| **Precio** | $0 | **$1.00/mes** |

---

## 🏗️ ARQUITECTURA

### 1. Modelos de Datos

**Agregar a `UsuarioApp` en Firestore (`usuarios/{uid}`)**:
```json
{
  "uid": "string",
  "email": "string",
  "plan": "free | premium",
  "suscripcionId": "string (Google Play ID)",
  "fechaPagoUltimo": "timestamp",
  "proximoRenovacion": "timestamp",
  "estadoSuscripcion": "active | canceled | expired | pending",
  "metadataPago": {
    "proveedor": "google_play | stripe | apple_store",
    "ordenId": "string",
    "moneda": "USD",
    "precio": 1.00
  }
}
```

**Configuración de Planes** (Firebase Remote Config o JSON estático):
```json
{
  "planes": {
    "free": {
      "maxBebes": 1,
      "estadisticas": false,
      "medicamentos": false,
      "temaLibre": false,
      "temaPorDefecto": "light",
      "notificaciones": true,
      "precio": 0
    },
    "premium": {
      "maxBebes": 10,
      "estadisticas": true,
      "medicamentos": true,
      "temaLibre": true,
      "temaPorDefecto": "system",
      "notificaciones": true,
      "precio": 1.00,
      "billingPeriod": "monthly",
      "skuAndroid": "bebecio_premium_monthly",
      "productIdApple": "com.bebecio.premium.monthly"
    }
  }
}
```

---

### 2. Servicios a Crear (NUEVOS)

#### **A) SubscriptionService** (`services/subscription.service.ts`)
```typescript
export class SubscriptionService {
  // Obtener plan actual del usuario
  obtenerPlanUsuario(): Promise<'free' | 'premium'>
  
  // Validar acceso a feature
  puedeAccederA(feature: 'multiples_bebes' | 'medicamentos' | 'estadisticas' | 'tema_dark'): Promise<boolean>
  
  // Iniciar compra según plataforma
  iniciarCompraAndroid(): Promise<void>
  iniciarCompraWeb(): Promise<void>
  
  // Verificación de renovación automática
  verificarRenovacionAutomatica(): Promise<void>
  
  // Observable para cambios en suscripción
  suscripcion$: Observable<SuscripcionFamilia>
}
```

#### **B) GooglePlayBillingService** (`services/google-play-billing.service.ts`)
```typescript
// Usa: @codetrix-studio/capacitor-google-play-billing
export class GooglePlayBillingService {
  iniciarSuscripcion(skuId: string): Promise<{ orderId, productId, token }>
  verificarSuscripcion(token: string): Promise<boolean>
  cancelarSuscripcion(): Promise<void>
}
```

#### **C) StripePaymentService** (`services/stripe-payment.service.ts`)
```typescript
// Usa: @stripe/capacitor-stripe
export class StripePaymentService {
  iniciarCheckout(email: string, planId: string): Promise<sessionId>
  verificarPago(sessionId: string): Promise<{ status, pedidoId }>
}
```

---

### 3. Cambios en Servicios Existentes

#### **3.1 bebe-familia.service.ts**
```typescript
// Modificar: obtenerBebesFamiliaActual()
async obtenerBebesFamiliaActual(): Promise<BebeFamilia[]> {
  const plan = await this.subscriptionService.obtenerPlanUsuario();
  const bebes = await obtenerBebesDelBackend();
  
  // Si es Free, retornar SOLO el primer bebé
  if (plan === 'free') {
    return bebes.slice(0, 1);
  }
  return bebes;
}

// Modificar: crearBebe()
async crearBebe(request: CrearBebeFamiliaRequest): Promise<BebeFamilia> {
  const plan = await this.subscriptionService.obtenerPlanUsuario();
  const bebesActuales = await this.obtenerBebesFamiliaActual();
  
  if (plan === 'free' && bebesActuales.length >= 1) {
    throw new Error('Plan Free permite solo 1 bebé. Suscribete por $1.00/mes para más.');
  }
  
  return await crearBebeDelBackend(request);
}
```

#### **3.2 theme.service.ts** ⭐ CRÍTICO
```typescript
// Modificar: cambiarTema()
async cambiarTema(tema: 'light' | 'dark' | 'system'): Promise<void> {
  const plan = await this.subscriptionService.obtenerPlanUsuario();
  
  // Plan Free SOLO permite 'light'
  if (plan === 'free' && tema !== 'light') {
    throw new Error('Tema oscuro disponible solo en plan Premium ($1.00/mes)');
  }
  
  await Preferences.set({ key: 'theme-preference', value: tema });
  this.aplicarTema(tema);
}

// Modificar: init()
async init(): Promise<void> {
  const plan = await this.subscriptionService.obtenerPlanUsuario();
  const temaGuardado = await Preferences.get({ key: 'theme-preference' });
  
  // Plan Free: IMPONER light (ignorar preferencia guardada)
  if (plan === 'free') {
    await Preferences.set({ key: 'theme-preference', value: 'light' });
    this.aplicarTema('light');
  } else {
    // Premium: usar preferencia guardada o 'system'
    const tema = temaGuardado?.value || 'system';
    this.aplicarTema(tema);
  }
}
```

#### **3.3 medicamento.service.ts** (NUEVO)
```typescript
export class MedicamentoService {
  async obtenerMedicamentosDelBebe(bebeId: string): Promise<MedicamentoBebe[]> {
    const plan = await this.subscriptionService.obtenerPlanUsuario();
    
    if (plan === 'free') {
      throw new Error('Medicamentos disponibles solo en plan Premium ($1.00/mes)');
    }
    
    return await obtenerMedicamentosDelBackend(bebeId);
  }
  
  async agregarMedicamento(bebeId: string, medicamento: MedicamentoBebe): Promise<void> {
    const plan = await this.subscriptionService.obtenerPlanUsuario();
    
    if (plan === 'free') {
      throw new Error('Medicamentos bloqueados para plan Free');
    }
    
    return await agregarMedicamentoAlBackend(bebeId, medicamento);
  }
}
```

---

### 4. Cambios en Componentes

#### **4.1 tab1.page.ts**
```typescript
async ngOnInit() {
  const plan = await this.subscriptionService.obtenerPlanUsuario();
  
  if (plan === 'free' && this.bebes.length >= 1) {
    this.mostrarBannerUpSell = true;
    this.textoBanner = "Agrega hasta 10 bebés + medicamentos con plan Premium por solo $1.00/mes";
  }
}
```

#### **4.2 tab3.page.ts** - Agregar sección "Mi Suscripción"
```html
<div class="seccion-suscripcion">
  <h3>Plan Actual: {{ planActual }}</h3>
  
  <ng-container *ngIf="planActual === 'free'">
    <p class="feature-list">
      <strong>Plan Free incluye:</strong>
      <ul>
        <li>1 bebé</li>
        <li>Notificaciones</li>
        <li>Tema claro (obligatorio)</li>
      </ul>
    </p>
    <p class="feature-list">
      <strong>Plan Premium ($1.00/mes) desbloquea:</strong>
      <ul>
        <li>Hasta 10 bebés</li>
        <li>Medicamentos</li>
        <li>Estadísticas gráficas</li>
        <li>Tema oscuro</li>
      </ul>
    </p>
    <button (click)="abrirPanelUpSell()" class="btn-primary">
      Suscribirse por $1.00/mes
    </button>
  </ng-container>
  
  <ng-container *ngIf="planActual === 'premium'">
    <p class="success">✅ Tienes acceso a todas las funcionalidades</p>
    <p>Próxima renovación: {{ proximoRenovacion | date: 'short' }}</p>
    <button (click)="cancelarSuscripcion()" class="btn-danger">
      Cancelar suscripción
    </button>
  </ng-container>
</div>
```

#### **4.3 Nuevo Componente: SuscripcionModalComponent**
**Ubicación**: `components/suscripcion-modal/suscripcion-modal.component.ts`

```typescript
export class SuscripcionModalComponent {
  planes = [
    {
      nombre: 'Free',
      precio: '$0',
      features: ['1 bebé', 'Notificaciones', 'Tema claro (obligatorio)'],
      esActual: true
    },
    {
      nombre: 'Premium',
      precio: '$1.00/mes',
      features: ['Hasta 10 bebés', 'Medicamentos', 'Estadísticas gráficas', 'Tema oscuro'],
      esActual: false,
      onClick: () => this.comprar()
    }
  ];
  
  async comprar() {
    try {
      if (this.esMobile()) {
        await this.googlePlayBillingService.iniciarSuscripcion('bebecio_premium_monthly');
      } else {
        await this.stripePaymentService.iniciarCheckout(this.usuario.email, 'premium');
      }
    } catch (error) {
      console.error('Error iniciando compra:', error);
      this.mostrarError('No se pudo iniciar la compra. Intenta de nuevo.');
    }
  }
}
```

---

### 5. Flujo de Usuario

```
┌─────────────────────────────────────┐
│      USUARIO NUEVO (Free)           │
└─────────────────────────────────────┘
              ↓
    [Crear cuenta + 1 bebé]
    [Tema = 'light' FORZADO]
              ↓
┌─────────────────────────────────────┐
│  ¿Agregar 2do bebé o medicamentos?  │
│  [Banner: "Premium $1.00/mes"]      │
└─────────────────────────────────────┘
              ↓
        ┌─────┴─────┐
        ↓           ↓
     [NO]         [SÍ - Comprar]
        ↓           ↓
    Continúa    [Modal de planes]
    con 1 bebé       ↓
    tema light   ┌───┴───┐
                 ↓       ↓
            ANDROID    WEB
                 ↓       ↓
            Google Play  Stripe
                 ↓       ↓
         [Token guardado en Firestore]
                 ↓
         [plan = 'premium']
                 ↓
      ✅ Acceso a todas las features
```

---

## 🔒 Seguridad: Firestore Rules

```firestore
// Solo usuario ve su data de suscripción
match /usuarios/{uid} {
  allow read, write: if request.auth.uid == uid;
}

// Validar límite de bebés por plan
match /familias/{familiaId}/bebes/{bebeId} {
  allow create: if request.auth.uid != null && 
                   verificarLimitePlan(request.auth.uid);
}
```

---

## ☁️ Cloud Function: Verificación de Suscripción

```typescript
// Ubicación: functions/src/verificarSuscripcion.ts

export const verificarSuscripcion = functions.https.onCall(
  async (data: { uid: string }, context) => {
    if (!context.auth?.uid) throw new Error('No autenticado');
    
    const usuarioDoc = await admin
      .firestore()
      .collection('usuarios')
      .doc(data.uid)
      .get();
    
    const usuario = usuarioDoc.data();
    
    // Validar expiración
    if (usuario.proximoRenovacion < new Date()) {
      return { plan: 'free', razon: 'Suscripción expirada' };
    }
    
    // Validar token con proveedor
    if (usuario.metadataPago.proveedor === 'google_play') {
      const esValida = await verificarTokenGoogle(usuario.metadataPago.token);
      if (!esValida) {
        return { plan: 'free', razon: 'Token inválido' };
      }
    }
    
    return {
      plan: usuario.plan,
      proximoRenovacion: usuario.proximoRenovacion
    };
  }
);
```

---

## 📦 Dependencias a Instalar

```bash
# Google Play Billing (Android)
npm install @codetrix-studio/capacitor-google-play-billing

# Stripe (Web + Mobile)
npm install @stripe/capacitor-stripe

# Firebase Admin (Cloud Functions)
npm install firebase-admin --save-dev
```

---

## 📝 Lista de Cambios

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `models/usuario-app.model.ts` | Agregar campos de suscripción | 🔴 |
| `services/subscription.service.ts` | CREAR | 🔴 |
| `services/google-play-billing.service.ts` | CREAR | 🔴 |
| `services/stripe-payment.service.ts` | CREAR | 🟡 |
| `services/bebe-familia.service.ts` | Validar plan | 🔴 |
| `services/theme.service.ts` | **FORZAR LIGHT para Free** | 🔴 |
| `services/medicamento.service.ts` | Bloquear si Free | 🔴 |
| tab1.page.ts | Banner upSell | 🟡 |
| tab3.page.ts | Sección suscripción | 🟡 |
| `components/suscripcion-modal/` | CREAR | 🟡 |
| package.json | Agregar librerías | 🔴 |

---

## ✅ Checklist de Validación

### Funcionalidad
- [ ] Usuario Free ve solo 1 bebé
- [ ] Usuario Free NO puede crear 2do bebé
- [ ] Usuario Free NO puede ver/crear medicamentos
- [ ] Usuario Free tema = 'light' SIEMPRE
- [ ] Usuario Premium accede a todas features
- [ ] Compra en Android funciona (Google Play)
- [ ] Compra en Web funciona (Stripe)

### Backend
- [ ] Cloud Function valida suscripción
- [ ] Firestore Rules protege datos
- [ ] Token se guarda correctamente
- [ ] Renovación automática funciona

### Google Play Compliance
- [ ] [ ] Política de reembolso visible
- [ ] [ ] Botón cancelar en configuración
- [ ] [ ] Términos de servicio actualizados
- [ ] [ ] Privacy policy actualizada

---

## 📅 Fases de Implementación

### Fase 1: Setup Básico (Semana 1)
- [ ] Crear SubscriptionService
- [ ] Agregar GooglePlayBillingService
- [ ] Guardar suscripción en Firestore
- [ ] Actualizar modelo UsuarioApp

### Fase 2: Validación (Semana 2)
- [ ] Bloquear features por plan
- [ ] Forzar tema light para Free
- [ ] Bloquear medicamentos
- [ ] Cloud Function verificación

### Fase 3: UI/UX (Semana 3)
- [ ] Modal de suscripción
- [ ] Banner upSell
- [ ] Sección en Tab3
- [ ] Manejo de errores

### Fase 4: Testing (Semana 4)
- [ ] Testing exhaustivo
- [ ] Google Play beta
- [ ] Feedback usuarios
- [ ] Publicación final

---

## ⚠️ Consideraciones Especiales

1. **Tema Forzado** ⭐
   - Free SIEMPRE = 'light'
   - No sigue configuración del sistema
   - Premium = 'light' | 'dark' | 'system'

2. **Graceful Degradation**
   - Si falla verificación → asumir Free
   - Cachear plan localmente (24h)

3. **Migración**
   - Usuarios actuales → plan Free
   - Opción para upgradear

4. **Medicamentos**
   - Bloquear lectura Y escritura en Free
   - Mostrar mensaje claro de upgrade

---

## 📞 Próximos Pasos

1. ✅ Plan aprobado - Listo para implementar
2. Inicio Fase 1: Setup básico
3. Crear Cloud Functions
4. Setup Google Play Console (testing interno)
5. Testing en Android físico
6. Publicación en Google Play

---

**Última actualización**: 3 Junio 2026  
**Estado**: ✅ APROBADO Y LISTO PARA IMPLEMENTAR
```

Copia este contenido y créalo como archivo: **`docs/MONETIZACION-PLAN.md`**

Está todo claro, estructurado y listo para que cualquier IA o Codex lo entienda perfectamente. ✅Copia este contenido y créalo como archivo: **`docs/MONETIZACION-PLAN.md`**

Está todo claro, estructurado y listo para que cualquier IA o Codex lo entienda perfectamente. ✅