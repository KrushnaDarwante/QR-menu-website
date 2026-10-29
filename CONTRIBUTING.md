# QR Dine OS - Contributing Guidelines (CONTRIBUTING.md)

## Development Workflow
1. Fork and clone the repository.
2. Install dependencies: `npm install`.
3. Run tests before submitting PR: `npx --yes tsx --test src/tests/*.test.ts`.
4. Ensure TypeScript compiles without errors: `npm run lint`.
5. Verify changes locally with the dev server: `npm run dev`.

## Code Style & Standards
- Enforce strict typing in TypeScript. Avoid `any`.
- Keep pricing calculations strictly in server modules (`src/core/pricing.ts`).
- Ensure all mutation endpoints validate tenant IDs and role permissions.
- Provide descriptive commit messages following the Conventional Commits specification.
