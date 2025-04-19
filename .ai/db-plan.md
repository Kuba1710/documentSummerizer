# Schemat bazy danych PostgreSQL dla SciSummarize MVP

## 1. Tabele, kolumny, typy danych i ograniczenia

### Tabela `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE CHECK (length(username) >= 3),
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `documents`
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size_kb INTEGER NOT NULL CHECK (file_size_kb <= 10240), -- Max 10MB (10240KB)
    upload_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_timestamp TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);
```

### Tabela `summaries`
```sql
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `feedback`
```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
    is_accepted BOOLEAN NOT NULL,
    feedback_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(summary_id) -- Ensure only one feedback per summary
);
```

## 2. Relacje między tabelami

1. **Użytkownik ➝ Dokumenty**: Relacja jeden-do-wielu (1:N)
   - Użytkownik może mieć wiele dokumentów
   - Każdy dokument należy do jednego użytkownika

2. **Dokument ➝ Podsumowania**: Relacja jeden-do-wielu (1:N)
   - Dokument może mieć wiele podsumowań (wersje)
   - Każde podsumowanie należy do jednego dokumentu

3. **Podsumowanie ➝ Feedback**: Relacja jeden-do-jednego (1:1)
   - Podsumowanie może mieć jeden feedback
   - Feedback dotyczy jednego podsumowania

## 3. Indeksy

```sql
-- Indeks na kolumnie username dla szybkiego wyszukiwania użytkowników
CREATE INDEX idx_users_username ON users(username);

-- Indeks na user_id w tabeli documents dla szybkiego filtrowania dokumentów użytkownika
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Indeks na upload_timestamp w tabeli documents dla efektywnego sortowania
CREATE INDEX idx_documents_upload_timestamp ON documents(upload_timestamp);

-- Indeks na expiration_timestamp dla szybkiego wyszukiwania dokumentów, które wygasły
CREATE INDEX idx_documents_expiration ON documents(expiration_timestamp);

-- Indeks na document_id w tabeli summaries dla szybkiego wyszukiwania podsumowań dokumentu
CREATE INDEX idx_summaries_document_id ON summaries(document_id);

-- Indeks dla szybkiego wyszukiwania aktualnych podsumowań
CREATE INDEX idx_summaries_is_current ON summaries(is_current);

-- Złożony indeks dla wyszukiwania aktualnej wersji podsumowania dokumentu
CREATE INDEX idx_summaries_document_current ON summaries(document_id, is_current) WHERE is_current = TRUE;
```

## 4. Zasady PostgreSQL (Row Level Security)

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Polityka dla tabeli users - użytkownik może zobaczyć tylko swój rekord
CREATE POLICY users_isolation_policy ON users
    FOR ALL
    TO authenticated
    USING (id = current_user_id());

-- Polityka dla tabeli documents - użytkownik może zobaczyć tylko swoje dokumenty
CREATE POLICY documents_isolation_policy ON documents
    FOR ALL
    TO authenticated
    USING (user_id = current_user_id());

-- Polityka dla tabeli summaries - użytkownik może zobaczyć tylko podsumowania swoich dokumentów
CREATE POLICY summaries_isolation_policy ON summaries
    FOR ALL
    TO authenticated
    USING (document_id IN (SELECT id FROM documents WHERE user_id = current_user_id()));

-- Polityka dla tabeli feedback - użytkownik może zobaczyć tylko feedback do swoich podsumowań
CREATE POLICY feedback_isolation_policy ON feedback
    FOR ALL
    TO authenticated
    USING (summary_id IN (
        SELECT s.id FROM summaries s
        JOIN documents d ON s.document_id = d.id
        WHERE d.user_id = current_user_id()
    ));
```

## 5. Funkcje i triggery

### Funkcja do uzyskania ID bieżącego użytkownika
```sql
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
    SELECT CAST(current_setting('app.current_user_id', TRUE) AS UUID);
$$;
```

### Funkcja i trigger do automatycznego ustawienia expiration_timestamp
```sql
CREATE OR REPLACE FUNCTION set_document_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.expiration_timestamp := NEW.upload_timestamp + INTERVAL '24 hours';
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_document_expiration
BEFORE INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION set_document_expiration();
```

### Funkcja i trigger do zarządzania wieloma wersjami podsumowań
```sql
CREATE OR REPLACE FUNCTION manage_summary_versions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ustawienie is_current=FALSE dla wszystkich poprzednich podsumowań tego dokumentu
    UPDATE summaries
    SET is_current = FALSE
    WHERE document_id = NEW.document_id AND id != NEW.id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_manage_summary_versions
AFTER INSERT ON summaries
FOR EACH ROW
EXECUTE FUNCTION manage_summary_versions();
```

### Funkcja do usuwania przeterminowanych dokumentów
```sql
CREATE OR REPLACE FUNCTION delete_expired_documents()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM documents
        WHERE expiration_timestamp <= CURRENT_TIMESTAMP
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$;
```

## 6. Dodatkowe uwagi i wyjaśnienia

1. **Obsługa wielu wersji podsumowań**:
   - Tabela `summaries` zawiera kolumny `version` i `is_current` do zarządzania wersjami podsumowań
   - Trigger `manage_summary_versions` automatycznie ustawia poprzednie wersje jako nieaktualne
   - Pole `is_current` pozwala na szybkie filtrowanie aktualnej wersji podsumowania

2. **Automatyczne usuwanie dokumentów**:
   - Funkcja `delete_expired_documents()` może być wywoływana przez zadanie cron
   - Alternatywnie, można użyć mechanizmu PostgreSQL pg_cron do regulowanego usuwania

3. **Format ścieżki pliku**:
   - Kolumna `file_path` w tabeli `documents` przechowuje ścieżkę relatywną lub absolutną do pliku PDF w systemie plików
   - Rekomendowany format: `/storage/user_{user_id}/{document_id}.pdf`

4. **Bezpieczeństwo**:
   - Używamy UUID zamiast sekwencyjnych ID, co zwiększa bezpieczeństwo
   - Row Level Security (RLS) zapewnia, że użytkownicy mają dostęp tylko do swoich danych
   - Funkcja `current_user_id()` zakłada, że aplikacja ustawia ID bieżącego użytkownika w zmiennej sesyjnej

5. **Skalowalność**:
   - Zastosowane indeksy optymalizują najczęstsze zapytania
   - Brak przechowywania plików PDF w bazie danych zwiększa skalowalność
   - Możliwe jest późniejsze dodanie mechanizmu partycjonowania tabeli `documents` według daty, jeśli będzie to konieczne 