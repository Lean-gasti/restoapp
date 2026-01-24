---
trigger: always_on
---

# Guía de Buenas Prácticas Frontend

## MenuManager – SOLID y Clean Architecture

**Stack:** Angular (Módulos)
**Versión:** 1.1
**Fecha:** 23 de enero de 2026

---

## Propósito del Documento

Este documento define **reglas obligatorias, recomendaciones y límites técnicos** que el agente de Google Antigravity debe aplicar al:

* Generar o revisar código frontend
* Proponer arquitectura Angular
* Evaluar PRs y decisiones técnicas
* Detectar anti-patterns

Este es el **estándar oficial** del frontend de MenuManager.

---

## Convenciones Normativas

* ✅ **Obligatorio:** debe cumplirse siempre
* ⚠️ **Recomendado:** mejora calidad y mantenibilidad
* 💡 **Opcional:** aporta valor en contextos específicos

---

## 1. Principios SOLID en Angular

### 1.1 SRP – Single Responsibility

✅ Un servicio o clase tiene **una sola responsabilidad**.

Ejemplo:

* `ProductApiService` → HTTP
* `ProductStorageService` → storage
* `ProductFormatterService` → formateo
* `ProductFacadeService` → orquestación

---

### 1.2 OCP – Open/Closed

✅ Extender sin modificar código existente.

* Uso de interfaces
* Estrategias intercambiables

Ejemplo: `ICatalogExporter` → Pdf / Excel / Csv

---

### 1.3 LSP – Liskov

✅ Implementaciones respetan contratos.

* Mismos tipos de retorno
* Sin efectos colaterales inesperados

---

### 1.4 ISP – Interface Segregation

⚠️ Interfaces pequeñas y específicas.

Ejemplo:

* `IProductReader`
* `IProductWriter`

---

### 1.5 DIP – Dependency Inversion

✅ Componentes dependen de **abstracciones**, no implementaciones.

* Providers con `useClass`
* Fácil mocking y testing

---

## 2. Clean Architecture

### 2.1 Capas

* **Presentation:** Components, Pipes
* **Application:** Facades, Use Cases
* **Domain:** Entities, Value Objects
* **Infrastructure:** HTTP, Storage

Las dependencias **siempre apuntan hacia adentro**.

---

### 2.2 Estructura Base

```
core/
  domain/
  application/
  infrastructure/
features/
shared/
```

---

## 3. Domain Layer

### 3.1 Entidades

✅ Contienen lógica de negocio.

* Validaciones de dominio
* Métodos factory
* Conversión a DTO

Ejemplo:

* `Product.create()`
* `product.activate()`

---

### 3.2 Value Objects

⚠️ Inmutables y comparables por valor.

Ejemplos:

* Price
* Email
* Slug

---

## 4. Application Layer

### 4.1 Use Cases

✅ Un caso de uso = una acción del usuario.

* Orquestan entidades
* Manejan errores
* Retornan DTOs simples

---

### 4.2 Facades

✅ Punto único de entrada por feature.

Responsabilidades:

* Estado reactivo (RxJS)
* Loading y errores
* Cache

Beneficio: componentes simples y testeables.

---

## 5. Componentes

### 5.1 Smart vs Presentational

**Smart Components**

* Conocen Facades
* Manejan flujos

**Presentational Components**

* `@Input` / `@Output`
* `OnPush`
* Sin lógica de negocio

---

## 6. Estado y RxJS

✅ Buenas prácticas:

* `async pipe`
* `takeUntil(destroy$)`
* `shareReplay` para caché
* `catchError` centralizado

---

## 7. Formularios Reactivos

✅ Obligatorio:

* Reactive Forms
* Validators reutilizables
* Mensajes de error claros
* `markAllAsTouched()` en submit

---

## 8. Routing e Interceptors

### Routing

* Lazy loading por feature
* Guards de auth y roles

### Interceptors

* Auth (JWT)
* Error (logging + UX)
* Loading (spinner global)

---

## 9. Testing

✅ Obligatorio:

* Unit tests de lógica
* Mocks de dependencias

⚠️ Recomendado:

* E2E con Cypress o Playwright

Cobertura mínima esperada: **70%**

---

## 10. Performance

✅ Buenas prácticas:

* `OnPush`
* `trackBy`
* Inmutabilidad
* Lazy loading

---

## 11. Anti-Patterns Prohibidos

❌ Lógica de negocio en componentes
❌ Servicios que hacen múltiples cosas
❌ Suscripciones sin unsubscribe
❌ Uso de `any`
❌ Acceso directo a HttpClient desde componentes

---

## 12. Checklist Rápido

* [ ] Facade por feature
* [ ] Use cases definidos
* [ ] Separación de capas
* [ ] OnPush aplicado
* [ ] Tests de negocio
* [ ] Guards y interceptors

---

**Este documento es la fuente única de verdad para el frontend de MenuManager.**
