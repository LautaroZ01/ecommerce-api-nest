# 🛍️ NestJS Professional Ecommerce API

<p align="center">
  <a href="https://ecommerce-api-b2cz.onrender.com/api/docs" target="blank">
    <img src="https://img.shields.io/badge/LIVE_DEMO-Swagger_UI-green?style=for-the-badge&logo=swagger" alt="Live Demo" />
  </a>
  <a href="http://nestjs.com/" target="blank">
    <img src="https://img.shields.io/badge/built_with-NestJS-red?style=for-the-badge&logo=nestjs" alt="NestJS" />
  </a>
</p>

> 🚀 **API Desplegada y Funcional:** [Ver Documentación Swagger](https://ecommerce-api-b2cz.onrender.com/api/docs)

> Una API RESTful escalable y modular construida con NestJS, PostgreSQL y TypeORM.
> Este proyecto implementa patrones de diseño avanzados, seguridad robusta y documentación automatizada.

## 📋 Tabla de Contenidos
1. [Descripción](#-descripción)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Arquitectura y Patrones](#-arquitectura-y-patrones)
4. [Instalación y Uso](#-instalación-y-uso)
5. [Variables de Entorno](#-variables-de-entorno)
6. [Guía de Comandos (Cheat Sheet)](#-guía-de-comandos-cheat-sheet)

---

## 📖 Descripción

Este backend gestiona un sistema de Ecommerce completo, incluyendo gestión de usuarios, autenticación segura, catálogo de productos y procesamiento de órdenes de compra con control de stock transaccional.

El objetivo principal fue migrar de una arquitectura Express flexible a una arquitectura **NestJS opinada y orientada a empresas**.

### Funcionalidades Clave:
* **Auth:** Registro, Login, JWT via **HttpOnly Cookies**, y Renovación de Tokens.
* **RBAC (Role Based Access Control):** Diferenciación entre usuarios y administradores mediante Decoradores y Guards personalizados.
* **Productos:** CRUD completo con validación de datos automática y paginación.
* **Órdenes:** Sistema de carrito de compras con **Transacciones ACID** para asegurar la integridad del stock.
* **Documentación:** API completamente documentada con Swagger (OpenAPI).

---

## 🛠️ Stack Tecnológico

* **Core:** [NestJS](https://nestjs.com/) (Node.js Framework) + TypeScript.
* **Base de Datos:** PostgreSQL.
* **ORM:** TypeORM (Patrón Data Mapper & Repository).
* **Validación:** `class-validator` y `class-transformer`.
* **Seguridad:** * `passport` + `passport-jwt` (Estrategias de Auth).
    * `bcrypt` (Hashing de contraseñas).
    * `cookie-parser` (Manejo seguro de cookies).
* **Documentación:** `@nestjs/swagger`.

---

## 🏗️ Arquitectura y Patrones

Este proyecto sigue los principios SOLID y la arquitectura modular de NestJS.

### Conceptos Implementados:

1.  **Módulos y DI (Dependency Injection):**
    * Desacoplamiento total entre la lógica de negocio (Services) y las rutas (Controllers).
    * Uso de `ConfigModule` para manejo seguro de variables de entorno.

2.  **DTOs (Data Transfer Objects):**
    * Uso estricto de DTOs para prevenir *Mass Assignment*.
    * Validaciones automáticas (`@IsString`, `@Min`, `@IsOptional`) y transformación de tipos (`transform: true`).

3.  **Seguridad Avanzada:**
    * **Guards:** `AuthGuard` (Passport) y `UserRoleGuard` (Custom) para proteger rutas.
    * **Custom Decorators:** `@Auth()`, `@GetUser()`, `@RoleProtected()` para mantener el código limpio y declarativo.
    * **Cookies:** El JWT no se expone al cliente, viaja en una cookie `HttpOnly`, protegiendo contra ataques XSS.

4.  **Base de Datos y Transacciones:**
    * Uso de `QueryRunner` para manejar transacciones manuales.
    * **Rollback automático:** Si falla la creación de una orden, el stock descontado se revierte automáticamente para evitar inconsistencias.
    * Relaciones One-To-Many y Many-To-One optimizadas.

5.  **Manejo de Errores:**
    * Centralización de errores de base de datos (códigos únicos de Postgres, foreign keys violations) en una capa de servicio.

---

## 🚀 Instalación y Uso

### Prerrequisitos
* Node.js (v18 o superior LTS).
* pnpm (recomendado) o npm.
* PostgreSQL corriendo localmente o en Docker.

### Pasos
1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd ecommerce-api
    ```

2.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```

3.  **Configurar entorno:**
    Crea un archivo `.env` basado en el ejemplo de abajo.

4.  **Levantar el proyecto (Dev):**
    ```bash
    pnpm run start:dev
    ```

5.  **Acceder a la documentación:**
    Visita `http://localhost:3000/api/docs` para ver Swagger.

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de Base de Datos
DB_PASSWORD=tu_password_segura
DB_NAME=ecommerce_db
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres

# Configuración de JWT
JWT_SECRET=EstaEsUnaClaveSuperSecreta123456
NODE_ENV=development 
# (Usar 'production' en deploy para activar cookies Secure: true)
```

## ⚡ Guía de Comandos (Cheat Sheet)

| Acción | Comando | Descripción |
| :--- | :--- | :--- |
| **Crear Recurso** | `nest g res <nombre>` | Crea Módulo, Controlador, Servicio, Entidad y DTOs (CRUD). |
| **Crear Módulo** | `nest g mo <nombre>` | Crea solo el módulo. |
| **Crear Servicio** | `nest g s <nombre>` | Crea solo el servicio. |
| **Iniciar Dev** | `pnpm run start:dev` | Inicia el servidor con Hot Reload. |
| **Tests Unitarios** | `pnpm test` | Ejecuta los tests de Jest. |
| **Tests E2E** | `pnpm run test:e2e` | Ejecuta tests de integración. |