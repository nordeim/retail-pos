# Reference Investigation — VeloxPOS (`veloxposretail.base44.app`)

> Evidence dossier for the authorized replication of the reference POS app.
> Every claim carries an evidence label: **Verified** (observed live via
> agent-browser 0.39.0 on 2026-10-25/26), **Reasoned** (inferred from
> evidence), **Assumed** (implementation decision), **Unknown** (blocker
> stated). Screenshots live in `docs/reference-evidence/ref-*.png`.
> Credentials used: the operator's own account (see conversation; never
> committed to source — the seed reads `SEED_OWNER_EMAIL` /
> `SEED_OWNER_PASSWORD` env vars instead).

## 1. Site map & routes

| Route (PascalCase) | Nav label | Status | Evidence |
|---|---|---|---|
| `/` (Terminal) | Terminal | 200 | ref-terminal.png — Verified |
| `/Dashboard` | Dashboard | 200 | ref-dashboard.png — Verified |
| `/Inventario` | Inventario | 200 | ref-inventario.png — Verified |
| `/Sales` | Ventas | 200 (note: NOT `/Ventas` — lowercase `/ventas` is a 404) | ref-ventas.png — Verified |
| `/Registers` | Cajas | 200 | ref-cajas.png — Verified |
| `/Cashiers` | Cajeros | 200 | ref-cajeros.png — Verified |
| `/Reports` | Reportes | 200 | ref-reportes.png — Verified |
| `/StoreSettings` | Ajustes | 200 | ref-ajustes.png — Verified |
| `/login` | — | 200, light theme | ref-login.png — Verified |
| unknown path | — | 404, dark card, violet 404 badge, "Ir al Terminal" CTA | ref-404.png — Verified |

Navigation is client-side; the app is a SPA behind a Base44 host with an
`Edit with Base44` badge (not part of the product UI — excluded from the
clone). **Verified.**

## 2. Auth

- `/login`: LIGHT theme page (body `rgb(248,250,252)`-family gradient; card
  white, radius ~24px). Anatomy top-to-bottom: dark circular logo with 3D
  cube art (~96px), H1 "Welcome to VeloxPOS" (dark navy, ~30px bold),
  subtitle "Sign in to continue" (slate), four social buttons (Google /
  Microsoft / Facebook / Apple — white, gray border, brand icon left),
  "OR" divider, centered label "Email", input with mail icon +
  `you@example.com` placeholder, "Password" input with lock icon + dots,
  "Sign in" primary button, "Forgot password?" link-button, "Need an
  account? Sign up" link-button. — **Verified** (ref-login.png,
  ref-login-bottom.png, DOM snapshot).
- Session: cookie-based (survives reloads; `/api/auth/me`-style gate — the
  root redirects to `/login` when the cookie is cleared). **Verified**
  (cleared storage → redirect to `/login`).
- Forgot-password and sign-up surfaces were not exercised end-to-end (their
  flows would email tokens); the clone implements the same two surfaces +
  reset route. **Reasoned/Assumed.**

## 3. Global chrome (dark)

- Body/canvas: `rgb(8, 10, 20)` (#080a14). **Verified** (computed style).
- Sidebar: fixed, full height, `bg-[#0d0f1a]`, border-r `#1e2235`, white
  text, width **220px expanded / 68px collapsed**, `transition-all
  duration-300`. Brand: 40px violet-gradient rounded chip with lightning
  glyph + store name ("Mi Tienda" — the configured store name) in bold
  white. Collapse toggle (`‹`) sits at the sidebar BOTTOM-left. —
  **Verified** (computed styles + toggle click test).
- Nav items (8, in order): Terminal (shopping-cart), Dashboard (chart),
  Inventario (package), Ventas (history/clock), Cajas (monitor), Cajeros
  (users), Reportes (file-text), Ajustes (settings gear). Active item:
  violet-indigo gradient pill, white text, rounded ~12px. — **Verified**
  (ref-*.png).
- **Mobile (≤1024px): the reference keeps the 220px sidebar expanded and
  squeezes main content; no hamburger, no drawer.** At 390×844 the content
  overflows and clips. — **Verified** (ref-mobile-dashboard.png). This is
  the reference's biggest UX defect; the clone ships a working mobile
  drawer (functional superset) and pins it with e2e specs.

## 4. Per-view inventory (what exists, what it shows)

### 4.1 Terminal (`/`)
- Two-pane: left = scan/grid area, right = TICKET panel.
- **No-shift empty state** (what the account can see): card with monitor
  icon, "No hay turno activo", "Ve a **Cajas** para abrir un turno antes de
  realizar ventas." Right pane: "AGREGADO" kicker, "TICKET" heading, cart
  icon, "Escanea o selecciona productos", disabled emerald "COBRAR $0.00".
  — **Verified** (ref-terminal.png + DOM).
- Active-shift state: **Unknown** — the reference account has 0 cashiers
  and the "Abrir Turno" dialog's cajero dropdown is EMPTY, so a shift cannot
  be opened on the reference at all (dead end). The clone fills this gap
  (superset): cashier CRUD + working shift lifecycle + full ticket flow.
  The unknowns (grid layout with shift active, payment dialog) are designed
  to match the reference's own design language and its sales data model.

### 4.2 Dashboard (`/Dashboard`)
- H1 "Dashboard" (`text-2xl sm:text-3xl font-bold`, slate-800/900 family,
  tracking-tight) + long Spanish date "domingo 25 de octubre, 2026".
- 4 stat cards: VENTAS HOY ($, emerald icon), TRANSACCIONES (0, violet cart),
  PRODUCTOS (12, blue box), STOCK BAJO (1, amber warning) — uppercase bold
  labels, big values, rounded icon square top-right with a GHOST duplicate
  icon behind (offset, low-opacity). — **Verified**.
- "Ventas — Últimos 7 días" chart card (violet heading): line/area over
  lun–dom, dashed grid, Y 0–4 integers. — **Verified** (flat zero line
  visible).
- "Productos por Categoría" donut (violet/green/white segments) + legend
  with counts: Lácteos 2, Limpieza 2, Higiene Personal 2, Alimentos 3,
  Snacks 1 (green slice = Bebidas). — **Verified**.
- "Productos con stock bajo" card (amber ⚠): rows with amber-tinted chip —
  "Atún Dolores 295g · 3 en stock (mín. 5)". — **Verified**.

### 4.3 Inventario (`/Inventario`)
- H1 + "12 productos registrados", violet-gradient "+ Nuevo Producto"
  button (top-right), search input ("Buscar por nombre o código..."),
  category filter chips: Todos (active violet), Snacks, Lácteos, Higiene
  Personal, Limpieza, Alimentos, Bebidas. — **Verified**.
- Table columns: PRODUCTO (icon chip + name), CÓDIGO, PRECIO, STOCK,
  CATEGORÍA (dark pill), ESTADO (green "Activo" pill), ACCIONES (edit +
  delete icon buttons). — **Verified**.
- The 12 seeded products (name / barcode / price / stock / category):
  1. Yogurt Danone Natural 900g — 7501005102148 — $38.50 — 10 — Lácteos
  2. Frijoles La Costeña 560g — 7501017006113 — $22.50 — 30 — Alimentos
  3. Leche Lala Entera 1L — 7501055301114 — $26.50 — 24 — Lácteos
  4. Shampoo Pantene 400ml — 7501001165599 — $89.00 — 12 — Higiene Personal
  5. Cloro Cloralex 1L — 7501025400117 — $24.00 — 22 — Limpieza
  6. Papel Higiénico Pétalo 4 rollos — 7501019600012 — $35.00 — 17 — Higiene Personal
  7. Sabritas Original 45g — 7501011115019 — $16.00 — 35 — Snacks
  8. Agua Bonafont 1L — 7501013100018 — $12.00 — 60 — Bebidas
  9. Coca-Cola 600ml — 7501055300120 — $18.50 — 47 — Bebidas
  10. Atún Dolores 295g — 7501024520148 — $32.00 — 3 — Alimentos (stock bajo)
  11. Pan Bimbo Blanco — 7441029500103 — $52.00 — 15 — Alimentos
  12. (12th row below fold; count pinned by dashboard stats + "12 productos
      registrados") — **Verified for 11, count Verified for 12**.
- "Nuevo Producto" dialog fields: Nombre *, Código de barras *, Categoría
  (select "Seleccionar"), Precio de venta *, Costo, Stock actual (0),
  Stock mínimo (5), IVA (%) (16), Unidad (select "Pieza"), Imagen del
  producto (file), "Producto activo" switch (default ON), Cancelar / Crear
  (disabled until required fields). — **Verified** (ref-producto-modal.png).

### 4.4 Ventas (`/Sales`)
- H1 "Historial de Ventas" + "N ventas registradas", search ("Buscar por
  ticket, cliente o cajero...").
- Table: TICKET (violet link `V-XXXXXXXX`), FECHA (`19/04/26 22:09`),
  CAJERO, MÉTODO (dark pill with banknote icon "Efectivo"), TOTAL (muted),
  ESTADO (green "Completada"), ACCIONES (eye = detail, mail = send receipt).
- Seeded sales: V-MO6BJT7G — 19/04/26 22:09 — Cesar Martínez — Efectivo —
  $21.46; V-MMPNY55Z — 14/03/26 01:45 — Cesar Martínez — Efectivo — $61.48.
  — **Verified**.
- Ticket detail dialog: "Ticket V-MO6BJT7G"; Fecha "19 abr 2026, 22:09";
  Cajero; Método; Caja ("Caja 1"); lines "1 × Coca-Cola 600ml — $21.46";
  Subtotal $18.50 / IVA $2.96 / Total $21.46. **Money model verified:
  product prices are IVA-EXCLUSIVE; the ticket shows line total = price ×
  (1+IVA%), subtotal = Σ pre-tax, IVA = Σ tax, Total = subtotal + IVA
  (16% Coca-Cola).**

### 4.5 Cajas (`/Registers`)
- H1 "Cajas Registradoras" + "N cajas configuradas", "+ Nueva Caja" button.
- Register cards: white-accented top strip, monitor icon in white chip, name
  ("Caja 2" / "Caja 1"), location ("Área de abarrotes" / "Entrada
  principal"), status pill "Cerrada" (white), full-width emerald "Abrir
  Turno" button, trash icon. — **Verified**.
- "Abrir Turno — Caja 1" dialog: "Cajero/a *" select ("Seleccionar cajero")
  + "Fondo de caja inicial" money input + "Iniciar Turno" (disabled until
  cajero chosen). **Verified; unusable on the reference (0 cashiers).**
- "Nueva Caja" dialog: "Nombre *", "Ubicación", Cancelar / Crear. —
  **Verified**.

### 4.6 Cajeros (`/Cashiers`)
- H1 "Cajeros" + "N usuarios registrados". Empty state ("No hay usuarios
  registrados") with **NO create button anywhere on the page** — a dead-end
  on the reference. The clone adds "Nuevo Cajero" (superset). — **Verified**.
- "Turnos Recientes" table: CAJERO, CAJA, INICIO (`09/04 01:39`), FIN
  (`19/04 22:16`), VENTAS ($ sum), ESTADO ("Cerrado"). Two seeded closed
  shifts for Cesar Martínez. — **Verified**.

### 4.7 Reportes (`/Reports`)
- H1 "Reportes" (white, brighter than other H1s) + "Análisis de ventas e
  ingresos"; segmented period control: 7 días / 14 días / 30 días (active
  violet) / 90 días. — **Verified**.
- Stats: INGRESOS TOTALES (violet trend icon), TRANSACCIONES (green
  calendar), TICKET PROMEDIO (violet card icon) — icon LEFT of text here.
- "VENTAS DIARIAS" area chart with $-prefixed Y labels + dashed grid.
- "INGRESOS POR MÉTODO DE PAGO" + "DETALLE POR MÉTODO" cards ("Sin datos en
  este período"). — **Verified**.

### 4.8 Ajustes (`/StoreSettings`)
- H1 "Ajustes de la Tienda" + "Personaliza tu negocio".
- Card "Información del Negocio" (violet store icon): Nombre de la tienda *
  ("Mi Tienda"), Logotipo ("Subir logo" upload), Dirección, Teléfono, Email,
  RFC / ID Fiscal, Moneda (select, "MXN - Peso Mexicano").
- "Personalización": Color primario `#6366f1`, Color secundario `#8b5cf6`
  (color inputs). — **Verified** (input values).
- "Ticket / Recibo": Pie del ticket (textarea).
- "Proveedor de Pagos con Tarjeta": Proveedor select ("Ninguno").
- "Categorías de Producto": "Agregar" control + chips (the 6 categories).
- "Guardar Cambios" button. — **Verified**.

## 5. Data model (Reasoned from UI + write-probe constraints)

Entities: **StoreSetting** (singleton: name, logo, address, phone, email,
fiscalId, currency, primaryColor, secondaryColor, ticketFooter,
cardProvider), **Category** (name), **Product** (name, barcode, categoryId,
price, cost, stock, minStock, ivaRate, unit, image?, active), **Register**
(name, location, status), **Cashier** (name, pin?, active), **Shift**
(registerId, cashierId, openedAt, closedAt?, openingFloat, closingAmount?),
**Sale** (ticketNo, registerId, cashierId, shiftId?, method, status,
subtotal, tax, total, clientName?, createdAt), **SaleItem** (saleId,
productId, name snapshot, qty, unitPrice, ivaRate, lineTotal).
Ticket numbers: `V-` + 8 uppercase base-36 chars. — **Verified** for
format (2 samples), **Assumed** for alphabet.

## 6. Design language tokens (Verified via computed styles)

| Token | Value |
|---|---|
| Canvas | `#080a14` |
| Sidebar / card surface | `#0d0f1a`, border `#1e2235` |
| Sidebar widths | 220px expanded / 68px collapsed |
| Primary gradient | violet → indigo (buttons ~`#7c3aed`→`#6d28d9`; settings colors `#6366f1` / `#8b5cf6`) |
| Success | emerald (`#10b981`-family "Abrir Turno", "Activo", "Completada") |
| Warning | amber (`#f59e0b`-family stock-bajo) |
| Headings | slate-800/900 on dark canvas (muted look), 24–30px bold |
| Radius | 12px buttons/inputs (rounded-xl), 16px cards (rounded-2xl) |
| Font | system ui-sans stack; tables use uppercase bold 11–12px headers |
| Stat icons | 40px+ rounded squares, solid fills (emerald/violet/blue/amber) + ghost duplicate behind |
| 404 | dark card, violet gradient "404" badge, "← Ir al Terminal" CTA with glow |

## 7. Gaps the clone fills (functional superset)

1. Working mobile navigation drawer (reference has none at ≤1024px).
2. Cashier creation + management (reference page is a dead end).
3. Openable shifts → the Terminal actually sells: product grid, search,
   category chips, ticket with qty controls, COBRAR dialog (Efectivo with
   change calculation / Tarjeta), stock decrement, sale persistence.
4. Close-shift flow with closing count (reference "Cerrado" rows imply it).
5. Receipt-detail view, ticket search, low-stock alerts — already live.
6. Case-insensitive route aliases (`/ventas` → Ventas) — superset nicety
   while PascalCase routes stay canonical for parity.

## 8. Unknowns & blockers

- The reference's active-shift Terminal UI, payment dialog, and
  close-shift dialog are unobservable (no cashiers can exist on the
  reference account; creating one is impossible from the UI). Designed
  from the app's own design language instead. **Blocker: reference dead
  end.**
- Sign-up/reset flows: buttons exist; the pages they open were not walked
  (email-gated). The clone implements equivalent surfaces.
- The 12th seeded product's row is below the fold; its values are
  **Unknown** — the clone seeds 12 products matching the 11 verified +
  "Pan Bimbo Blanco" count parity (dashboard "PRODUCTOS 12" pins the
  count; the 12th item is an Assumed row: "Jabón Zote Barra 400g —
  7501234567890 — $18.00 — 20 — Limpieza").
