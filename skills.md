# AI Agent Iteration Guide

When creating new iterations or modifying this codebase, please adhere to the following guidelines to ensure consistency, performance, and stability.

## 1. Project Architecture & Framework
- **Next.js App Router:** This project uses the modern Next.js App Router (`app/` directory). All new pages should be created using `page.js` / `page.jsx` within the appropriate directory under `app/`.
- **Server vs Client Components:** By default, Next.js components are Server Components. Only use the `"use client"` directive when you specifically need client-side interactivity (e.g., hooks like `useState`, `useEffect`, or event listeners). Keep client boundaries as low in the component tree as possible.
- **Routing & API:** Use Route Handlers (`route.js`) inside the `app/api/` directory for backend API endpoints.

## 2. Code Style & Formatting
- **Clean Code:** Write clean, modular, and self-documenting code. Use meaningful variable and function names.
- **Component Structure:** Keep components small and focused on a single responsibility. Extract reusable UI elements into the `components/` directory.
- **Imports:** Group your imports logically (e.g., React/Next.js imports first, then external libraries, then internal modules, then styles).

## 3. Styling
- **Aesthetics & UI:** Follow the project's established design system. Ensure new components are responsive and maintain consistent spacing, typography, and color schemes.
- **Tailwind/CSS:** If utilizing Tailwind CSS or standard CSS modules, ensure class names and styles are properly scoped to avoid side effects. Follow any design guidelines specified in `design.md`.

## 4. State Management & Data Fetching
- **Data Fetching:** Prefer Server Components for data fetching where applicable. Use Next.js extended `fetch` API for caching and revalidation.
- **State:** Keep local state minimal. Elevate state only when necessary, and consider URL search parameters for shareable state.

## 5. Security & Performance
- **Environment Variables:** Never hardcode sensitive credentials. Always use environment variables (`process.env.VAR_NAME`) and document required variables in `.env.example`.
- **Optimization:** Use Next.js built-in optimization components like `<Image />` for images and `<Link />` for navigation to ensure fast load times.

## 6. Testing & Quality Assurance
- Ensure changes do not break existing functionality. 
- Run standard linters or formatting tools (e.g., `eslint.config.mjs`) to verify code quality before finalizing your changes.
- Add or update tests in the `tests/` directory if you introduce new critical logic.

## 7. Documentation
- When making significant changes, update the relevant documentation (e.g., `README.md` or `design.md`).
- Comment complex logic directly in the code to provide context for future iterations.

## Summary Checklist for Agents
- [ ] Checked `AGENTS.md` and `design.md` for specific architectural or system constraints.
- [ ] Used correct Next.js App Router conventions.
- [ ] Respected Server/Client component boundaries.
- [ ] Styled components responsively.
- [ ] Ensured code passes linter and tests.
