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
* **`SUPABASE_URL`:** URL del proyecto (pública en el cliente).
* **`SUPABASE_ANON_KEY`:** Clave pública anonimizada (Publishable Key). Se incluye en la app cliente para autorizar el tráfico. Toda la seguridad de datos descansa en **Row Level Security (RLS)** dentro de la base de datos de Supabase.
* **`SUPABASE_SERVICE_ROLE_KEY`:** Clave con privilegios de superusuario que bypass-ea todas las políticas RLS. **Nunca debe incluirse en la app de React Native ni en los secretos del repositorio móvil.**

### 3.2. Configuración en el Gestor de CI/CD (GitHub Secrets)
Se configuran como variables protegidas separadas por entorno:

| Nombre del Secreto | Descripción | Entorno |
| :--- | :--- | :--- |
| `SUPABASE_URL_PROD` | URL del proyecto Supabase de producción | Producción |
| `SUPABASE_ANON_KEY_PROD` | Anon Key de Supabase de producción | Producción |
| `SUPABASE_URL_STAGING` | URL del proyecto Supabase de staging | Staging |
| `SUPABASE_ANON_KEY_STAGING` | Anon Key de Supabase de staging | Staging |
| `ANDROID_KEYSTORE_BASE64` | Archivo `.keystore` codificado en base64 | Producción/Staging |
| `ANDROID_KEYSTORE_PASSWORD` | Contraseña del Keystore | Producción/Staging |
| `ANDROID_KEY_ALIAS` | Alias de la llave privada | Producción/Staging |
| `ANDROID_KEY_PASSWORD` | Contraseña de la llave privada | Producción/Staging |
| `APP_STORE_CONNECT_KEY_CONTENT`| Llave privada AuthKey (`.p8`) de Apple | Producción/Staging |

### 3.3. Inyección de Variables en Tiempo de Compilación (*Build-Time*)

#### En React Native CLI (con `react-native-config` / `dotenv`):
En el pipeline de GitHub Actions, antes de compilar:
```yaml
- name: Inject Environment Variables
  run: |
    echo "SUPABASE_URL=${{ secrets.SUPABASE_URL_PROD }}" >> .env
    echo "SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY_PROD }}" >> .env