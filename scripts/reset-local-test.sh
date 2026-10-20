#!/usr/bin/env bash
# Réinitialise le Supabase LOCAL et crée un compte admin de test (jamais en production).
set -euo pipefail
npx supabase db reset >/dev/null
SR=$(npx supabase status -o json 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])")
curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users -H "apikey: $SR" -H "Authorization: Bearer $SR" -H "Content-Type: application/json" \
  -d '{"email":"admin-test@tmt.local","password":"TestAdmin!2026","email_confirm":true}' -o /dev/null
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -qc "insert into public.admin_users(user_id) select id from auth.users where email='admin-test@tmt.local';"
echo "base locale prête"
