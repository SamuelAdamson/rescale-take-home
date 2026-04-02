# ── base: install dependencies ────────────────────────────────────────────────
FROM python:3.14-slim AS base

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ── test: full dev deps + source, runs Django test suite ──────────────────────
FROM base AS test

RUN uv sync --frozen

COPY manage.py ./
COPY config/ config/
COPY jobs/ jobs/
COPY tests/ tests/

CMD ["uv", "run", "manage.py", "test", "tests/"]

# ── production: gunicorn serving the Django app ───────────────────────────────
FROM base AS production

COPY entrypoint.sh ./
COPY manage.py ./
COPY config/ config/
COPY jobs/ jobs/

# migrate database on startup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uv", "run", "--no-sync", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "--keep-alive", "0"]
