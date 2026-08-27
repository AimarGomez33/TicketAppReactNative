### 2.1. Fase de CI (Continuous Integration - PR Level)
Se ejecuta en runners basados en Linux (`ubuntu-latest`) por su rapidez y bajo costo.
1. **Instalación y Caché:** Restauración de dependencias utilizando `pnpm` y su lockfile (`pnpm-lock.yaml`).
2. **Validación Estática:** Ejecución de `pnpm typecheck` (o `pnpm exec tsc --noEmit`) y `pnpm run lint`.
3. **Ejecución de Pruebas:** Ejecución de `pnpm test -- --coverage --maxWorkers=2`.
4. **Validación de Seguridad:** Escaneo de dependencias vulnerables mediante `pnpm audit`.

### 2.2. Fase de CD (Continuous Deployment - Main / Release Tags)
Se ejecuta al mergear en ramas productivas o generar etiquetas de versión (`git tag v1.X.X`).

#### Flujo Android (Linux Runner):
1. Configuración de entorno: Java JDK (versión 17+) y Android SDK Platform-Tools.
2. Decodificación del archivo de firmado: Extracción del `.keystore` desde GitHub Secrets.
3. Inyección de variables de entorno (`.env` o variables de compilación).
4. Ejecución de Fastlane (`fastlane android beta`):
   * Incremento automático del `versionCode`.
   * Ejecución de tarea Gradle `bundleRelease` para generar el Android App Bundle (`.aab`).
   * Carga a **Google Play Console (Internal Testing Track)** o Firebase App Distribution.

#### Flujo iOS (macOS Runner):
1. Configuración de versión de Xcode y CocoaPods.
2. Gestión de perfiles y certificados mediante Fastlane `match` o importación manual al Keychain del runner.
3. Inyección de variables de entorno.
4. Ejecución de Fastlane (`fastlane ios beta`):
   * Incremento automático del `build_number`.
   * Compilación y empaquetado del archivo `.ipa`.
   * Carga directa a **Apple TestFlight**.

---

## 3. Gestión de Secretos y Configuración con Supabase

### 3.1. Clasificación y Seguridad de Claves
* **URL y publishable key:** se capturan en tiempo de ejecución desde la configuración de cada terminal. No se inyectan durante la compilación ni se incluyen en la APK.
* **`SUPABASE_SERVICE_ROLE_KEY`:** clave de superusuario. Debe permanecer exclusivamente en un backend/Edge Function; nunca en la app, repositorio ni CI móvil.

### 3.2. Configuración en el Gestor de CI/CD (GitHub Secrets)
Se configuran como variables protegidas separadas por entorno:

| Nombre del Secreto | Descripción | Entorno |
| :--- | :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Archivo `.keystore` codificado en base64 | Producción/Staging |
| `ANDROID_KEYSTORE_PASSWORD` | Contraseña del Keystore | Producción/Staging |
| `ANDROID_KEY_ALIAS` | Alias de la llave privada | Producción/Staging |
| `ANDROID_KEY_PASSWORD` | Contraseña de la llave privada | Producción/Staging |
| `APP_STORE_CONNECT_KEY_CONTENT`| Llave privada AuthKey (`.p8`) de Apple | Producción/Staging |

### 3.3. Configuración de terminal

La APK se distribuye sin configuración de Supabase. Cada terminal recibe URL y publishable key mediante el modal de configuración. Protege los datos con RLS basado en identidad o con un backend/Edge Function; una publishable key no es un secreto.
