#!/usr/bin/env bash

set -e

# Pasamos la contraseña del usuario de backend al init.sql
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -v BACKEND_PASS="$DB_BACKEND_PASS" \
    -f /docker-entrypoint-initdb.d/db/init.sql
