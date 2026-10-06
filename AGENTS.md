# Frontend Agent Instructions

Read root `/AGENTS.md` first.
Read `/docs/13-frontend-design-system.md` before frontend visual or UI work.
Read `/docs/14-frontend-configuration.md` before changing frontend runtime configuration or API URL handling.
Read `/docs/15-frontend-authorization.md` before changing frontend permissions, guards, or permission-aware UI.
Read `/docs/24-local-development-authentication.md` before changing login integration, session state, CSRF interception, authentication guards, or local API proxy behavior.
Read `/docs/25-mfa-authentication.md` before changing MFA routes, enrollment/challenge UI, route-local MFA state, or MFA API integration.
Read `/docs/26-user-management.md` before changing User Management pages, editor state, or user administration API contracts.
Read `/docs/27-password-recovery.md` before changing forgot/reset password UI, password-recovery API contracts, reset-link handling, or recovery security behavior.
Read `/docs/28-dynamic-navigation.md` before changing navigation API state, sidebar metadata, route/icon validation, or navigation caching.

Applies to `/frontend`.

Technology:

- Angular latest stable
- standalone components
- Tailwind CSS
- strict TypeScript
- Signals
- RxJS
- Router
- HttpClient

Architecture target:

```text
src/app/
├── core/
│   ├── auth/
│   ├── authorization/
│   ├── guards/
│   ├── interceptors/
│   ├── http/
│   ├── config/
│   └── services/
├── layout/
│   ├── app-shell/
│   ├── sidebar/
│   ├── header/
│   └── page-container/
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   ├── utils/
│   └── types/
└── features/
    ├── dashboard/
    ├── clients/
    ├── employees/
    ├── dhs-library/
    ├── documents/
    ├── training/
    ├── background-checks/
    ├── expiry-review/
    ├── notifications/
    ├── reports/
    └── access-control/
```

Rules:

- standalone only
- lazy-load major features
- no NgRx initially
- no Material/PrimeNG/Bootstrap
- no HttpClient scattered inside components
- typed contracts
- injectable API configuration
- use the runtime configuration tokens defined by `/docs/14-frontend-configuration.md`; do not hardcode API URLs
- no secrets in frontend
- Tailwind primary styling
- frontend permission checks are UX only
- use the typed permission catalog and authorization patterns defined by `/docs/15-frontend-authorization.md`; backend authorization remains mandatory
- no multiple business modules unless current task requires them

Design:

- `/docs/13-frontend-design-system.md` is the source of truth for frontend visual tokens and conventions
- medical teal
- crisp white surfaces
- strong dark text
- consistent spacing
- accessible contrast
- no blurry theme
- no HFZA design carry-over
