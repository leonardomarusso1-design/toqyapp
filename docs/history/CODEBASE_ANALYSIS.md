# TOQY Codebase Analysis

**Date:** 2026-06-15 | **Analysis Scope:** Storage, Data Models, Mock Data, Supabase Integration, Access Keys

---

## 1. Current Storage Implementation

### 1.1 Main Storage Module: `src/lib/siteStorage.ts`
**Status:** Browser-based localStorage only (MVP phase)

**Exported Methods:**
- `getStoredSites()` → `ToqySite[]` - Retrieves all stored sites from localStorage
- `setStoredSites(sites)` → `void` - Persists sites to localStorage
- `getStoredSite(slugOrId)` → `ToqySite | undefined` - Finds site by slug or ID
- `saveStoredSite(site)` → `ToqySite` - Inserts or updates a single site
- `createStoredSite(site)` → `ToqySite` - Creates new site (forces status to "active")
- `deleteStoredSite(id)` → `void` - Soft deletes (tracks mock deletions separately)
- `mergeMockAndStoredSites()` → `ToqySite[]` - Merges mocks with localStorage sites (mocks are overrideable)
- `getSiteBySlug(slug)` → `ToqySite | undefined` - Gets site from merged list
- `validateClientKey(slug, key)` → `ToqySite | null` - Verifies edit key for a site
- `createPublicUrl(slug)` → `string` - Returns `/b/${slug}`
- `createEditUrl(slug)` → `string` - Returns `/editar/${slug}`

**Storage Keys:**
- `toqy_sites_v4` - Main site data (localStorage)
- `toqy_deleted_mock_sites_v1` - Tracks deleted mock IDs to prevent re-display

**Key Behaviors:**
- Auto-slugifies sites on save using `generateSlug()`
- Sets `updatedAt` timestamp on every save
- Merges mock sites with stored sites (stored sites override mocks by slug)
- Allows "soft deletion" of mock sites by storing their IDs

---

### 1.2 Data Provider Abstraction: `src/lib/dataProvider/`

#### `localProvider.ts` (Main Implementation)
**Status:** Duplicate of siteStorage.ts with newer interface naming (BioSite vs ToqySite)

**Exported Interface:**
```typescript
type DataProvider = {
  listBiosites: () => BioSite[]
  getBiositeById: (id: string) => BioSite | null
  getBiositeBySlug: (slug: string) => BioSite | null
  saveBiosite: (site: BioSite) => BioSite
  createBiosite: (site: BioSite) => BioSite
  deleteBiosite: (id: string) => void
  publishBiosite: (id: string) => BioSite | null
  pauseBiosite: (id: string) => BioSite | null
  duplicateBiosite: (id: string) => BioSite | null
  validateClientKey: (key: string, slug?: string) => BioSite | null
  validateAccessKey: (slug: string, key: string) => boolean
  createPublicUrl: (slug: string) => string
  createEditUrl: (slug: string) => string
}
```

**Key Methods Not in siteStorage.ts:**
- `publishBiosite()` / `pauseBiosite()` - Status management (active/disabled)
- `duplicateBiosite()` - Creates copy with new ID, slug, key, and "draft" status
- `validateClientKey()` - Validates edit key (returns site if valid, null if not)

**Notable Behaviors:**
- Uses `structuredClone()` to return deep copies of sites (prevents accidental mutations)
- `duplicateBiosite()` generates new ID, slug suffix ("-cópia"), and edit key
- `validateClientKey()` has flexible slug parameter (validates globally if slug omitted)

#### `types.ts` (Type Definitions)
```typescript
type BioSite = ToqySite  // Type alias for ToqySite
type CatalogItem = ToqyCatalogItem
type SiteButton = ToqyButton
type PixConfig = ToqySite["pix"]
type WifiConfig = ToqySite["wifi"]

type ClientKey = {
  siteId: string
  slug: string
  key: string
  createdAt?: string
}
```

**Note:** `ClientKey` is defined but not used anywhere in the codebase.

---

## 2. Mock Data Structure

### 2.1 Mock Sites Location
**File:** `src/lib/mockSites.ts`

**Mock Sites Defined (6 total):**

| ID | Slug | Name | Segment | Edit Key |
|---|---|---|---|---|
| `demo-barbearia` | `barbearia-andrian` | Espaço Andrian | Barbearia | `8392-1147` |
| `demo-pastel` | `pastel-da-praca` | Pastel da Praça | Pastelaria | `2222-3333` |
| `demo-mycell` | `my-cell` | M.Y Cell | Assistência Técnica | `4444-5555` |
| `demo-salao` | `salao-demo` | Studio Bella | Salão | `6666-7777` |
| `demo-clinica` | `clinica-demo` | Clínica Vida | Clínica | `8888-9999` |
| `demo-loja` | `loja-demo` | Loja Demo | Loja | `1111-2222` |

**Note on "barreira-andriano":** 
- Not found as exact match. The barbershop demo uses `barbearia-andrian` (slug) but has name "Espaço Andrian"
- Located in Vargem Grande do Sul - SP
- This is a **real business** (has actual Booksy booking URL, Google Maps location, WhatsApp, Instagram)

**Exported Helpers:**
```typescript
export const mockSites: ToqySite[]
export function getMockSiteBySlug(slug: string) → ToqySite | undefined
export const demoSlugs = mockSites.map(site => site.slug)
export function isDemoSlug(slug: string) → boolean
```

### 2.2 Mock Site Details

**Barbearia Andrian (demo-barbearia):**
- Full catalog with 9 services (Corte, Barba, Combos, Sobrancelha, Limpeza Pele, Escalda Pés, Terapia Capilar, Premium, Noivo)
- Pix enabled: Key `26287678801`, quick amounts [35, 55, 80]
- Wi-Fi enabled: "Barbearia Andrian" / "recorecobolao"
- Complete button set: WhatsApp, Instagram, Maps, Wi-Fi, Booking, Review, Pix, Catalog
- Theme: Dark with gold accents (#D4AF37 primary)

**Other Mocks (minimal):**
- Pastelaria, M.Y Cell, Salão, Clínica, Loja - created with basic template overrides
- Some have minimal catalog or contact info

---

## 3. Data Models

### 3.1 Core Types: `src/lib/types.ts`

#### Main Entity: `ToqySite`
```typescript
type ToqySite = {
  id: string
  slug: string
  segment: Segment  // 15 business types (barbearia, salao, loja, clinica, etc.)
  status: "active" | "draft" | "disabled"
  
  profile: {
    name: string
    title?: string
    description: string
    location: string
    profileImageUrl?: string
    logoUrl?: string
    logoSize: "small" | "medium" | "large"
    logoShape: "circle" | "rounded" | "square"
    backgroundImageUrl?: string
  }
  
  themePresetId?: string
  theme: {
    mode: "dark" | "light"
    backgroundType: "solid" | "gradient" | "image"
    background: string
    gradientFrom: string
    gradientTo: string
    card: string
    text: string
    muted: string
    primary: string
    secondary: string
    accent: string
    buttonFill: "solid" | "gradient" | "glass"
    buttonStyle: "full" | "icon"
    buttonRadius: "soft" | "rounded" | "pill"
    useBackgroundOverlay: boolean
  }
  
  plaqueTheme?: {
    useSameBackground: boolean
    backgroundImageUrl?: string
    backgroundStyle: "solid" | "gradient" | "image"
  }
  
  contact: {
    phone: string
    whatsapp: string
    whatsappMessage: string
    instagram?: string
    facebook?: string
    email?: string
    website?: string
  }
  
  links: {
    googleMapsUrl?: string
    googleReviewUrl?: string
    bookingUrl?: string
    menuUrl?: string
  }
  
  pix: {
    enabled: boolean
    key: string
    receiver: string
    bank?: string
    quickAmounts: number[]
    allowCustomAmount: boolean
    whatsappProofNumber: string
  }
  
  wifi: {
    enabled: boolean
    ssid: string
    password: string
    encryption: "WPA" | "WEP" | "nopass"
    checkinUrl?: string
    checkinLabel?: string
  }
  
  catalogLayout: "carousel" | "grid" | "stack" | "grouped" | "category-carousel"
  modules: {
    saveContact: boolean
    whatsapp: boolean
    instagram: boolean
    phone: boolean
    maps: boolean
    wifi: boolean
    pix: boolean
    pixHub: boolean
    googleReview: boolean
    booking: boolean
    catalog: boolean
  }
  
  buttons: ToqyButton[]
  catalog: CatalogItem[]
  editKey: string  // "XXXX-XXXX" format
  createdAt: string  // ISO date
  updatedAt: string  // ISO date
}
```

#### Button: `ToqyButton`
```typescript
type ToqyButton = {
  id: string
  label: string
  type: ToqyLinkType  // 24 types including whatsapp, instagram, pix, wifi, etc.
  url?: string
  enabled: boolean
}
```

#### Catalog Item: `CatalogItem`
```typescript
type CatalogItem = {
  id: string
  name: string
  description: string
  price?: string
  imageUrl?: string
  imageLayout: "square" | "horizontal"
  category?: string
  enabled: boolean
  actionLabel?: string
  actionUrl?: string
}
```

#### Segments (15 Total):
`barbearia`, `salao`, `restaurante`, `lanchonete`, `pastelaria`, `loja`, `assistencia_tecnica`, `clinica`, `petshop`, `oficina`, `delivery`, `servicos`, `fotografo`, `dentista`, `outro`

#### Button Types (24 Total):
`whatsapp`, `instagram`, `linkedin`, `email`, `facebook`, `pix`, `pixHub`, `phone`, `maps`, `wifi`, `telegram`, `youtube`, `tiktok`, `spotify`, `pdf`, `drive`, `image`, `website`, `menu`, `booking`, `review`, `catalog`, `event`, `custom`

### 3.2 Theme Presets: `src/lib/themePresets.ts`

**10 Pre-built Theme Presets:**
1. **TOQY Dark** - Navy/teal (default)
2. **Dark Gold** - Luxury for barbershops
3. **Blue Tech** - Tech/assistance services
4. **Food Red** - Restaurants/food
5. **Beauty Rose** - Salons/aesthetics
6. **Clinic Blue** - Clinics/healthcare (light mode)
7. **Pet Fun** - Pet shops (light mode)
8. **Minimal White** - Clean commercial (light mode)
9. **Orange Neon** - Fast sales/Pix focused
10. **Green Clean** - Natural/organic (light mode)

---

## 4. Supabase Integration Status

### 4.1 Browser Client: `src/lib/supabaseBrowser.ts`
**Status:** Minimal setup, not actively used

```typescript
export const TOQY_PUBLIC_ASSETS_BUCKET = "toqy-public-assets"

export function hasSupabaseBrowserEnv(): boolean
  // Checks: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function getSupabaseBrowserClient(): SupabaseClient | null
  // Returns client if env vars exist, null otherwise
```

**Current Usage:** Not used anywhere in the application code
**Backup Reference:** `src/app/app/configuracoes/page.tsx` checks `hasSupabaseBrowserEnv()` for UI indication

### 4.2 Server Client: `src/lib/supabaseServer.ts`
**Status:** Admin client setup only

```typescript
export function hasSupabaseEnv(): boolean
  // Checks: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY

export function getSupabaseAdmin(): SupabaseClient | null
  // Returns admin client with session persistence disabled
```

**Current Usage:** Not used anywhere in the application

### 4.3 Supabase Schema: `supabase/schema.sql`
**Status:** File exists but not reviewed in detail

---

## 5. Current Access Key Flow

### 5.1 Edit Key Generation & Validation

**Generation:** `src/lib/security.ts`
```typescript
export function generateEditKey(): string
  // Returns "XXXX-XXXX" format (random 4-digit + dash + random 4-digit)
```

**Validation Flow:**
1. User submits edit key via POST to `/api/sites/[slug]/verify-key`
2. Route handler calls `validateClientKey(key, slug)` from dataProvider
3. `validateClientKey()` finds site by slug and compares `site.editKey.trim() === key.trim()`
4. Returns `{ ok: true, status: 200 }` if valid, `{ ok: false, status: 401 }` if invalid

### 5.2 Key Storage & Management

**Where Keys Are Stored:**
- In each site object (`site.editKey`)
- Stored in localStorage as part of site data
- Visible in admin dashboard (`/app/clientes`)

**Key Display:**
- Admin can copy full key from `/app/clientes` page
- Key shared via WhatsApp message generated in `ClientesPage`
- Format shown as: "Chave de acesso: [4-digit-4-digit]"

**Key Lifecycle:**
- Generated on site creation using `generateEditKey()`
- Can be accessed/copied anytime from admin panel
- No key rotation mechanism exists
- No expiration handling

### 5.3 Access Control Points

**Routes Protected by Key Validation:**
1. `POST /api/sites/[slug]/verify-key` - Verifies key before edit operations
2. `PATCH /api/sites/[slug]/update` - Currently mock (localStorage on client)
3. `PATCH /api/sites/[slug]/services` - Currently mock (localStorage on client)

**Current API Endpoints (All Mock MVP):**
- `GET /api/sites` → Returns all biosites with source="dataProvider:local"
- `POST /api/sites/[slug]/verify-key` → Validates edit key
- `PATCH /api/sites/[slug]/update` → Mock response (client saves to localStorage)
- `PATCH /api/sites/[slug]/services` → Mock response (client saves to localStorage)

---

## 6. Pages & Routes Structure

### 6.1 Public Pages (Demo/Landing)
| Path | Component | Purpose | Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Landing page with features, plans, examples | ✅ Active |
| `/b/[slug]` | `src/app/b/[slug]/page.tsx` → `StoredPublicBioSite` | Public bio site view (SSR) | ✅ Active |
| `/[slug]/pix` | `src/app/[slug]/pix/page.tsx` → `StoredPixHub` | Pix payment modal for slug | ✅ Active |

### 6.2 Dashboard Pages (Authenticated)
| Path | Component | Purpose | Status |
|---|---|---|---|
| `/app` | `src/app/app/page.tsx` | Dashboard home | ✅ Active |
| `/app/novo` | `src/app/app/novo/page.tsx` → `SiteBuilder` | Create new bio site | ✅ Active |
| `/app/qr` | `src/app/app/qr/page.tsx` | Generate QR codes | ✅ Active |
| `/app/clientes` | `src/app/app/clientes/page.tsx` | View all sites + share keys | ✅ Active |
| `/app/configuracoes` | `src/app/app/configuracoes/page.tsx` | Settings, export, data mgmt | ✅ Active |
| `/editar/[slug]` | `src/app/editar/[slug]/page.tsx` → `SiteBuilder` | Edit existing bio site | ✅ Active |
| `/me` | `src/app/me/page.tsx` | User login/landing (assumed) | ⚠️ Not reviewed |

### 6.3 Legacy/Unused Routes
| Path | Status | Notes |
|---|---|---|
| `/[slug]` | ⚠️ Unused | Redirect? Fallback? |

---

## 7. Components & Their Usage

### 7.1 Active Components

| Component | Location | Exports | Used By | Purpose |
|---|---|---|---|---|
| `PublicBioSite` | `src/components/PublicBioSite.tsx` | `export function` | `StoredPublicBioSite`, `LiveBioSitePreview` | Renders public bio site view with all modules (Pix, Wi-Fi, Catalog, Contact) |
| `StoredPublicBioSite` | `src/components/StoredPublicBioSite.tsx` | `export default` | `src/app/b/[slug]/page.tsx` | Client wrapper: loads from localStorage first, falls back to mock |
| `PixHub` | `src/components/PixHub.tsx` | `export function` | `StoredPixHub` | Standalone Pix payment modal with QR code |
| `StoredPixHub` | `src/components/StoredPixHub.tsx` | `export default` | `src/app/[slug]/pix/page.tsx` | Client wrapper for PixHub: loads site from localStorage |
| `SiteBuilder` | `src/components/SiteBuilder.tsx` | `export function` | `/app/novo`, `/editar/[slug]` | Multi-step site editor (7 steps: Model, Profile, Theme, Buttons, Catalog, Preview, Summary) |
| `LiveBioSitePreview` | `src/components/LiveBioSitePreview.tsx` | `export function` | `SiteBuilder` (step 5) | Real-time preview of site as user edits |
| `ButtonEditor` | `src/components/ButtonEditor.tsx` | `export function` | `SiteBuilder` (step 3) | Manage buttons: reorder, enable/disable, edit URLs, add/remove |
| `ThemePresetPicker` | `src/components/ThemePresetPicker.tsx` | `export function` | `SiteBuilder` (step 2) | Visual theme preset selector |
| `ImageUploadField` | `src/components/ImageUploadField.tsx` | `export function` | `SiteBuilder` (logo, profile, background) | File upload input with preview |
| `ImageGuidelineHint` | `src/components/ImageGuidelineHint.tsx` | `export function` | `ImageUploadField` | Inline help text for image requirements |
| `DashboardShell` | `src/components/DashboardShell.tsx` | `export function` | All `/app/*` pages | Dashboard layout with nav, header, sidebar |
| `ClientShell` | `src/components/ClientShell.tsx` | `export function` | Unknown (likely layout wrapper) | Likely wrapper for client-side app shell |

### 7.2 Unused/Orphaned Components
**None identified.** All components are actively imported and used.

---

## 8. Helper Modules

### 8.1 Button Management: `src/lib/buttonSync.ts`
**Purpose:** Sync button list with module toggles (keep them in sync)

**Key Export:**
```typescript
export function syncModulesFromButtons(site: ToqySite): ToqySite
  // Auto-enables/disables modules based on button types
  // E.g., if whatsapp button is enabled → whatsapp module = true
```

**Button Type Options (33 listed):**
WhatsApp, Instagram, Phone, Maps, Wi-Fi, Pix, Catalog, Reviews, Booking, Website, Email, Menu, YouTube, TikTok, Telegram, PDF, Drive, Images, Custom Link

---

### 8.2 Button URL Generation: `src/lib/buttonUtils.ts`

**Key Functions:**
```typescript
export function buttonHref(site, button): string
  // Returns proper href/URL for button type (tel:, mailto:, https:, etc.)

export function whatsappUrl(site): string
  // Generates WhatsApp link with pre-filled message

export function wifiPayload(site): string
  // Generates Wi-Fi QR code payload (WIFI:T:WPA;S:SSID;P:PASSWORD;;)

export function pixPayload(site, amount?): string
  // Generates Pix QR code payload (EMV standard)

export function createVCard(site): string
  // Generates vCard (contact card) from site data
```

---

### 8.3 Segment Templates: `src/lib/segmentTemplates.ts`

**Purpose:** Pre-built templates for 15 business segments

**Exports:**
```typescript
export const segmentOptions: Array<{ value: Segment; label: string }>
export const segmentTemplates: SegmentTemplate[]

export function getSegmentTemplate(segment): SegmentTemplate
export function createSiteFromSegmentTemplate(segment, overrides?): ToqySite
export function applySegmentTemplate(site, segment): ToqySite
```

**SegmentTemplate Structure:**
- `segment`, `templateName`, `description`
- `defaultTheme` (ThemePreset ID)
- `modules` (which modules enabled by default)
- `buttons` (recommended buttons)
- `catalog` (sample items)
- `catalogLayout` (suggested layout)

**Customizations per Segment:**
- Background image URL
- Theme colors (dark/light mode)
- Button fill/radius/style
- Button layout (full vs. icon)

---

### 8.4 Security Utilities: `src/lib/security.ts`

**Key Functions:**
```typescript
export function generateId(prefix?): string
  // Returns crypto.randomUUID() or fallback with timestamp

export function generateSlug(value): string
  // Normalizes text: NFD decomposition, lowercase, alphanumeric + hyphens only

export function generateEditKey(): string
  // Returns "XXXX-XXXX" format

export function sanitizeText(value): string
  // Removes < and > characters

export function ensureUrl(value?): string
  // Adds https:// if not present

export function normalizePhone(value?): string
  // Removes all non-digits

export function normalizeInstagram(value?): string
  // Adds instagram.com prefix if not already a URL

export function isValidUrl(value?): boolean
  // Uses URL() constructor for validation
```

---

### 8.5 Data Validation: `src/lib/validation.ts`

**Single Export:**
```typescript
export function validateSite(site): 
  { ok: true; errors: [] } | { ok: false; errors: string[] }
```

**Checks:**
- Name not empty
- Slug not empty
- Website URL valid (if provided)
- Google Maps URL valid (if provided)
- Pix key filled (if Pix enabled)
- Wi-Fi SSID filled (if Wi-Fi enabled)
- Catalog items have names (if enabled)

---

## 9. Summary: What Needs Migration

### 9.1 Storage
- **Current:** Browser localStorage only (v4 schema)
- **Needed:** Supabase migration
- **Risk:** Version bumping on localStorage key (backward compatibility)

### 9.2 Access Control
- **Current:** Simple edit key stored with site data
- **Needed:** Proper auth system (email/password, OAuth, or public/private key)
- **Risk:** Edit keys visible in admin panel, no expiration

### 9.3 API
- **Current:** All routes are mocks returning success
- **Needed:** Real API handlers that persist to Supabase
- **Risk:** Client-side logic assumes localStorage (POST/PATCH endpoints)

### 9.4 Data Models
- **Current:** Dual naming (ToqySite vs. BioSite), ClientKey unused
- **Needed:** Consolidation and schema alignment with Supabase

### 9.5 Mock Data
- **Current:** 6 mock sites hardcoded in mockSites.ts
- **Needed:** Seed data management for Supabase

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   PUBLIC ROUTES                               │
│  /  (Landing)  │  /b/[slug]  (Public View)                  │
│  /[slug]/pix   (Pix Modal)                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  StoredPublicBioSite / StoredPixHub     │
        │  (Client wrappers: localStorage first)  │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  PublicBioSite / PixHub (Presenters)   │
        │  Renders buttons, Pix, Wi-Fi, Catalog   │
        └─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DASHBOARD ROUTES                            │
│  /app  │  /app/novo  │  /app/qr  │  /app/clientes           │
│  /app/configuracoes  │  /editar/[slug]                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  DashboardShell (Layout + Nav)          │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  SiteBuilder (Create/Edit)              │
        │  ├─ ThemePresetPicker (step 2)          │
        │  ├─ ButtonEditor (step 3)               │
        │  ├─ LiveBioSitePreview (step 5)         │
        │  └─ ImageUploadField (multiple)         │
        └─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER                                   │
│  ┌──────────────────────────────────────────────┐           │
│  │  localProvider (src/lib/dataProvider/)       │           │
│  │  • listBiosites()                            │           │
│  │  • saveBiosite() → localStorage              │           │
│  │  • validateClientKey() → boolean             │           │
│  │  • mergeMockAndStoredSites()                 │           │
│  └──────────────────────────────────────────────┘           │
│               ↓ (currently unused) ↓                         │
│  ┌──────────────────────────────────────────────┐           │
│  │  supabaseBrowser / supabaseServer (Setup)   │           │
│  │  • Env var checks only                       │           │
│  │  • No actual usage yet                       │           │
│  └──────────────────────────────────────────────┘           │
│               ↓                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  Browser localStorage (toqy_sites_v4)        │           │
│  │  + mockSites (6 hardcoded demos)             │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  HELPERS                                      │
│  buttonSync       buttonUtils      segmentTemplates           │
│  security         validation        themePresets              │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Key Findings

✅ **Well-Organized:**
- Clear separation of concerns (storage, UI, helpers)
- Consistent naming conventions
- Type-safe with TypeScript
- Responsive design with Tailwind CSS

⚠️ **Technical Debt / MVP Artifacts:**
- Dual type naming: ToqySite and BioSite (mostly used interchangeably)
- Unused ClientKey type definition
- API routes are all mocks returning success
- No authentication system (edit keys only)
- No Supabase integration (setup code only)
- localStorage v4 versioning (future version bumps risk compatibility)

🔴 **Not Production-Ready:**
- No database persistence
- No user accounts or proper auth
- No analytics tracking
- No backup/restore beyond manual export
- Edit keys visible to all users with dashboard access

---

