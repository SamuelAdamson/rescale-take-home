# Job Management Dashboard

## Backend Conventions (Django)

### Rules
- Keep views thin (no business logic)
- All business logic goes in `services/`
- Models should only contain data structure and simple helpers
- When adding dependencies use `uv add`
- All unit tests should run without the database, mock any necessary data
- Sanitize all incoming data for CREATE/UPDATE API endpoints
- All functions and models should have docstrings and type hints
- All tests should have type hints

- DO NOT introduce unnecessary complexity
- DO NOT add new frameworks or abstractions unless justified
- DO NOT bypass the service layer

### Structure
Use a layered approach:

- models/
- services/
- api/
  - serializers.py
  - views.py
  - urls.py


## Frontend Conventions (React + Vite + TS)

### Rules
- Use functional components only
- Use hooks (no class components)
- Use STRONG TYPING ONLY (avoid `any`)
- The style should be professional and resemble a modern cloud platform
- Keep components small and reusable
- Keep a consistent styling theme, any colors should be stored in css variables in root
- Use tailwind and radix to aid in styling when possible
- Use appropriate error handling and loading spinners when fetching data

### Structure
- components/
- pages/
- api/
- hooks/

### API Layer
- Centralize API calls in a dedicated module
- Do not call fetch/axios directly inside components

---

## Docker / Dev Environment

### Rules
- App must be fully containerized and independent from local environment
- App should be able to run with only the following system dependencies:
    - bash
    - docker
    - docker compose v2
    - make
- Tests should run successfully without any prior setup by only running `make test`

---

## Code Quality

### Python
- Format with ruff
- Follow PEP8

### TypeScript
- Format with ESLint + Prettier
- Strict mode enabled

---

## Expectations for Claude

When generating code:

- Prefer clarity over cleverness
- Write production-quality code, not prototypes
