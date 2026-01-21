# EduCert-Pro: AI Coding Agent Instructions

## Project Overview
EduCert-Pro is a **certificate generation and management system** for educational institutions. It's a React + TypeScript web app built with Vite that enables admins to create, customize, and export professional certificates as PDFs. The app works **completely offline** using browser localStorage.

### Key Features
- **Admin Dashboard**: Manage institute details (logo, seal, signature), courses, durations, certificate types
- **Certificate Generator**: Create personalized certificates with placeholder substitution ({{student}}, {{course}}, {{duration}}, etc.)
- **Multiple Templates**: 6 professional designs (Classic, Modern, Corporate, Elegant, Tech, Artistic)
- **PDF Export**: High-quality PDF generation with orientation support (landscape/portrait) using html2canvas + jsPDF
- **Offline-First**: All data persists in localStorage; no backend required

---

## Architecture & Data Flow

### 1. **State Management Pattern**
- **No Redux/Context**: App uses React `useState` directly for simplicity
- **Single Source of Truth**: `AppData` interface (in [types.ts](types.ts)) holds all configuration and metadata
- **Flow**: `App.tsx` loads data via `getAppData()` → manages local state → updates localStorage via `saveAppData()`

### 2. **Component Structure**
```
App.tsx (main state, view routing)
├── AdminDashboard (config UI: institute, courses, types, appearance)
├── Certificate (template selector & renderer)
└── CertificateTemplates.tsx (6 template implementations)
```

- **App.tsx**: Handles login state, form data, view routing ('login' | 'generator' | 'settings' | 'preview')
- **AdminDashboard.tsx**: Tabbed interface for modifying institute/course/type metadata; uses "tempData" pattern to accumulate changes before saving
- **Certificate.tsx**: Selects appropriate template based on `settings.activeTemplate`; processes description placeholders
- **CertificateTemplates.tsx**: 460+ lines of pure JSX for 6 template designs using Tailwind CSS

### 3. **Data Persistence**
- **Storage Key**: `EDUCERT_PRO_DATA` (defined in [constants.ts](constants.ts))
- **Storage Method**: `localStorage.setItem()` / `localStorage.getItem()`
- **Fallback**: If localStorage unavailable/corrupted, returns `DEFAULT_DATA` (hardcoded institute, courses, types)
- **Image Handling**: Logo, seal, signature, badge stored as Base64 strings (5-10MB localStorage limit in modern browsers)

### 4. **PDF Generation Pipeline**
```typescript
handleDownloadPDF() → html2canvas(DOM) → canvas.toDataURL() → jsPDF.addImage() → PDF.save()
```
- **Orientation**: Detects from `formData.orientation` → adjusts canvas dimensions (1123x794 landscape, 794x1123 portrait)
- **Scale**: `scale: 4` in html2canvas for high DPI output
- **Element ID**: Looks for `#certificate-to-download` in DOM; must be present on preview view

---

## Key Patterns & Conventions

### Data Type Patterns
- **Always use interfaces** from [types.ts](types.ts): `AppData`, `StudentCertificateData`, `InstituteDetails`, etc.
- **ID Conventions**: All entities (courses, durations, types) have `id: string` (format: 'c1', 'd2', 't3', etc.)
- **Dates**: Store as ISO strings (YYYY-MM-DD); format for display using `new Date().toLocaleDateString('en-GB', {year: 'numeric', month: 'long', day: 'numeric'})`

### Form State Pattern (in AdminDashboard)
1. Keep a `tempData` state copy
2. Accumulate changes in `tempData` as user edits
3. On "Save", call `saveAppData(tempData)` + `onUpdate(tempData)` to persist & propagate up
4. Use generic handlers for array operations:
   ```typescript
   const addItem = <T extends { id: string }>(key: 'courses' | 'durations' | 'types', newItem: T) => {
     setTempData(prev => ({ ...prev, [key]: [...prev[key], newItem] }));
   };
   ```

### Template Pattern (CertificateTemplates.tsx)
- All templates receive same `TemplateProps` interface
- Common props: `data`, `settings`, `courseName`, `typeTitle`, `description`, `formattedDate`, `qrUrl`, `orientation`
- **Placeholder Substitution** happens in [Certificate.tsx](components/Certificate.tsx) before passing to templates:
  - `{{student}}` → `data.studentName`
  - `{{course}}` → `course.name`
  - `{{duration}}` → `duration.label`
  - `{{startDate}}` → formatted `data.dateOfJoining`
  - Add new placeholders in `getDescription()` method

### Image Upload Flow
1. User selects file in AdminDashboard
2. `fileToBase64(file)` converts to Data URL
3. Store in `tempData.institute.[key]` (logo/seal/badge/signature)
4. On save, persisted as Base64 in localStorage
5. Display in templates via `<img src={base64String} />`

---

## Build & Development Workflow

### Commands
- **Dev**: `npm run dev` → Vite dev server on `http://localhost:3000`
- **Build**: `npm run build` → Produces optimized bundle in `dist/`
- **Preview**: `npm run preview` → Local preview of production build

### Key Dependencies
- **react 19.2.3 + react-dom**: UI framework
- **vite 6.2.0**: Build tool + dev server
- **typescript 5.8.2**: Type checking
- **lucide-react**: Icon library (used in buttons/headers)
- **html2canvas 1.4.1**: DOM → canvas for PDF generation
- **jspdf 2.5.1**: Canvas → PDF conversion
- **tailwindcss**: Assumed from CSS class patterns (not in package.json, likely injected)

### Styling Notes
- **Tailwind CSS**: All components use utility classes (w-full, h-full, flex, etc.)
- **Font families**: `font-serif`, `font-signature`, `font-official` assumed to be defined in global CSS/tailwind config
- **Color palette**: Navy-900, gold-600, slate-300, etc. (likely custom Tailwind config)

---

## Common Development Tasks

### Adding a New Template
1. Create a new `export const NewTemplate: React.FC<TemplateProps> = (...)` in [CertificateTemplates.tsx](components/CertificateTemplates.tsx)
2. Add case in [Certificate.tsx](components/Certificate.tsx) `renderTemplate()` switch: `case 'newtemplate': return <NewTemplate {...} />`
3. Update `activeTemplate` type in [types.ts](types.ts): `'classic' | 'modern' | ... | 'newtemplate'`
4. Add template option in AdminDashboard's appearance tab (template selector dropdown)

### Adding a New Certificate Field
1. Extend `StudentCertificateData` interface in [types.ts](types.ts)
2. Add form input in App.tsx's certificate generator form
3. Update placeholder substitution in Certificate.tsx's `getDescription()`
4. Update all templates to display the field

### Modifying Institute Metadata
1. Edit `DEFAULT_DATA.institute` in [constants.ts](constants.ts)
2. Or admin updates via AdminDashboard → General tab
3. Changes persist to localStorage via `saveAppData()`

### Debugging Storage Issues
- Open browser DevTools → Application → LocalStorage → Filter by `EDUCERT_PRO_DATA`
- Large images exceed 5-10MB limit: Alert "Storage full! Please try using smaller images."
- Clear localStorage: `localStorage.clear()` in console (app will reload with DEFAULT_DATA)

---

## Critical Files Reference
| File | Purpose |
|------|---------|
| [App.tsx](App.tsx) | Main component, routing, login, certificate form |
| [types.ts](types.ts) | All TypeScript interfaces (single source of type truth) |
| [constants.ts](constants.ts) | DEFAULT_DATA, ADMIN_CREDENTIALS, STORAGE_KEY |
| [components/AdminDashboard.tsx](components/AdminDashboard.tsx) | Settings UI, data editing |
| [components/Certificate.tsx](components/Certificate.tsx) | Template selection, placeholder substitution |
| [components/CertificateTemplates.tsx](components/CertificateTemplates.tsx) | 6 certificate designs |
| [utils/storage.ts](utils/storage.ts) | localStorage getters/setters, Base64 encoding |

---

## Testing & Validation Checklist
- [ ] Certificates generate with correct placeholder values
- [ ] PDF export preserves orientation (landscape vs portrait)
- [ ] localStorage persists after page refresh
- [ ] Admin changes to institute/courses sync across all certificates
- [ ] Image uploads work without exceeding storage quota
- [ ] All 6 templates render without layout issues
