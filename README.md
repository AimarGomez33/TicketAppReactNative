# Ticket App POS

Aplicación React Native para operación de mesas, mostrador, cocina e impresión
térmica. El catálogo comercial, precios, favoritos y modificadores se cargan
desde Supabase: la aplicación no incluye platillos ni precios como respaldo.

## Arquitectura

- `src/store/useCartStore.ts`: estado y acciones de Zustand; coordina UI,
  sincronización e impresión, sin contener reglas puras reutilizables.
- `src/domain/orders/`: referencias de orden, totales y actualización de
  carritos desde el catálogo remoto.
- `src/domain/products/`: identidad determinista de productos configurados y
  reglas de modificadores.
- `src/services/supabaseService.ts`: validación de filas externas, persistencia
  y Realtime de Supabase.
- `src/services/orderSyncDebouncer.ts`: debounce independiente por referencia;
  cambios de una mesa no cancelan los de otra.
- `src/services/printerService.ts`: generación e impresión ESC/POS por TCP.

Las mesas usan referencias numéricas. Los pedidos para llevar usan referencias
`L-xxxxx`; ambos se muestran siempre con `getOrderDisplayLabel`.

## Desarrollo

Requiere Node 22+ y pnpm 10.

```sh
pnpm install
pnpm start
pnpm android
```

Validación local:

```sh
pnpm run typecheck
pnpm run lint
pnpm test --runInBand
```

## Configuración de Supabase

Desde la aplicación abre **Servidor** e ingresa la Project URL y la anon key.
La URL y la anon key, que son configuración pública de cliente, se validan y
persisten localmente con AsyncStorage para reconectar después de reiniciar la
aplicación. No se incorporan en el repositorio ni en la APK/IPA. Una
configuración almacenada inválida se descarta y la app continúa en modo sin
configurar. Nunca captures ni persistas una `service_role` key, contraseñas u
otros secretos de servidor.

Ejecuta una vez `supabase_schema.sql` al crear una instalación nueva, o
`supabase_realtime_migration.sql` para actualizar una instalación existente.
En Supabase configura RLS de acuerdo con tu entorno; el schema incluido es una
configuración operativa inicial, no una sustitución de controles de producción.

## Compilación y despliegue Android

Compilar no despliega ni sube archivos:

```sh
pnpm build:apk
pnpm build:aab
```

Las releases requieren firma de producción. Configura estas variables antes de
ejecutar una tarea `Release`:

- `ANDROID_KEYSTORE_FILE`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

La compilación release falla si falta alguna; nunca usa el keystore de debug.

El despliegue es una acción independiente y explícita:

```sh
pnpm deploy:device
pnpm upload:drive
pnpm build:drive
```

`pnpm build:apk` sólo compila; `pnpm upload:drive` sólo carga el APK ya
generado; `pnpm build:drive` encadena ambas acciones de forma explícita. Ni
este comando ni `./gradlew assembleRelease` suben archivos automáticamente.

En GitHub Actions, el workflow de build Android requiere los secretos
equivalentes y `ANDROID_KEYSTORE_BASE64`; sólo genera artefactos y no publica
ni despliega automáticamente.

## Pruebas de regresión

Las pruebas cubren cálculos de carrito, referencias para llevar, debounce por
orden, identidad de configuraciones, modificadores, store e impresión.
