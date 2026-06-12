# Runbook: Disaster Recovery — odtwarzanie danych

Dwie niezależne warstwy ochrony danych:

1. **Neon PITR (primary)** — point-in-time recovery całej bazy Postgres. Szybkie, pełne odtworzenie. Pierwszy wybór przy awarii bazy.
2. **R2 snapshot (secondary, off-site)** — codzienny job `backup-to-r2` (03:15 UTC) zapisuje pod `backups/`:
   - `backups/products/products-YYYY-MM-DD.json[.enc]`
   - `backups/orders/orders-YYYY-MM-DD.json[.enc]` (zawiera PII)
   - `backups/pgdump/pgdump-YYYY-MM-DD.sql.enc` — tylko gdy `BACKUP_PGDUMP=1` i `pg_dump` dostępny.

Backupy są szyfrowane klientowo (AES-256-GCM) gdy ustawiono `BACKUP_ENCRYPTION_KEY`. Retencja: `BACKUP_RETENTION_DAYS` (domyślnie 30 dni).

## Zmienne środowiskowe

| Zmienna | Rola |
|---|---|
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Dostęp do R2 |
| `BACKUP_ENCRYPTION_KEY` | Klucz AES-256 (hex 64 znaki lub base64, 32B). `openssl rand -hex 32` |
| `BACKUP_RETENTION_DAYS` | Retencja (domyślnie 30). `0` = brak czyszczenia |
| `BACKUP_PGDUMP` | `1` = dołącz pełny `pg_dump` (wymaga binarki) |
| `DATABASE_URL` | Źródło dla `pg_dump` |

> **Klucz szyfrowania trzymaj POZA R2** (sekret w Railway/menedżerze sekretów). Bez niego zaszyfrowanych backupów nie odczytasz.

## Test-restore (rób okresowo, np. kwartalnie)

Weryfikuje, że najnowsze backupy są pobieralne, odszyfrowywalne i parsowalne:

```bash
# tylko weryfikacja (wypisuje entity/count/exported_at)
pnpm --filter @lumine/backend restore:verify

# + zapis odszyfrowanych plików lokalnie do ./restore
pnpm --filter @lumine/backend restore:verify -- --out ./restore
```

Wynik `Test-restore zakończony: N backup(ów) zweryfikowanych.` = OK. Brak/niepowodzenie = sprawdź `S3_*` i `BACKUP_ENCRYPTION_KEY`.

## Scenariusze odtwarzania

### A) Awaria bazy (dane uszkodzone/utracone)
1. **Neon PITR**: w konsoli Neon przywróć branch do punktu sprzed incydentu. Zaktualizuj `DATABASE_URL` jeśli zmienił się endpoint. Restart backendu.
2. Weryfikacja: logowanie do panelu `/magazyn`, lista produktów i zamówień.

### B) Neon niedostępny / potrzebny niezależny snapshot
1. Pobierz i odszyfruj najnowsze backupy: `restore:verify -- --out ./restore`.
2. Jeśli istnieje `pgdump-*.sql.enc` — odszyfruj i wczytaj do świeżej bazy:
   - odszyfrowanie: użyj `restore:verify` (rozszerz o pgdump) lub skryptu z `decodeBackup`.
   - `psql "$NEW_DATABASE_URL" -f pgdump.sql`.
3. Jeśli tylko JSON — `./restore/products.json` i `./restore/orders.json` służą do ręcznej weryfikacji/odtworzenia katalogu i odczytu zamówień (import produktów: CSV/admin lub skrypt migracyjny).

### C) Wyciek/utrata tokenów R2
1. Cloudflare → R2 → Manage API Tokens → **revoke** skompromitowanego tokenu, utwórz nowy.
2. Zaktualizuj `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`.
3. Backupy pozostają bezpieczne, jeśli były szyfrowane klientowo (atakujący nie ma `BACKUP_ENCRYPTION_KEY`).

## Po incydencie
- Sprawdź logi `[backup-to-r2]` (ostatni udany snapshot) i alerty Sentry (`job: backup-to-r2`).
- Potwierdź, że job znów tworzy świeże backupy następnego dnia.
- Zanotuj przyczynę i ewentualne luki w tym runbooku.
