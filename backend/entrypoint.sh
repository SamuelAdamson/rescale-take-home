#!/bin/sh
set -e

echo "Running migrations..."
uv run --no-sync manage.py migrate --no-input

exec "$@"
