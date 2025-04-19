# REST API Plan

## 1. Zasoby
- **Users**: Reprezentuje konta użytkowników (tabela `users`)
- **Documents**: Reprezentuje przesłane dokumenty PDF (tabela `documents`)
- **Summaries**: Reprezentuje wygenerowane podsumowania dokumentów (tabela `summaries`)
- **Feedback**: Reprezentuje oceny użytkowników dotyczące podsumowań (tabela `feedback`)

## 2. Punkty końcowe

### Uwierzytelnianie
#### Rejestracja użytkownika
- **Metoda**: POST
- **Ścieżka**: `/auth/register`
- **Opis**: Rejestracja nowego konta użytkownika
- **Struktura żądania**:
```json
{
  "username": "string (min. 3 znaki)",
  "password": "string"
}
```
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "username": "string",
  "created_at": "timestamp"
}
```
- **Kody powodzenia**: 201 Created
- **Kody błędów**: 
  - 400 Bad Request (błąd walidacji)
  - 409 Conflict (nazwa użytkownika zajęta)

#### Logowanie
- **Metoda**: POST
- **Ścieżka**: `/auth/login`
- **Opis**: Uwierzytelnienie użytkownika i uzyskanie tokenu dostępu
- **Struktura żądania**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **Struktura odpowiedzi**:
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "UUID",
    "username": "string"
  }
}
```
- **Kody powodzenia**: 200 OK
- **Kody błędów**: 401 Unauthorized (nieprawidłowe dane logowania)

#### Wylogowanie
- **Metoda**: POST
- **Ścieżka**: `/auth/logout`
- **Opis**: Unieważnienie bieżącego tokenu dostępu
- **Nagłówki**: Authorization: Bearer {token}
- **Odpowiedź**: 204 No Content
- **Kody powodzenia**: 204 No Content
- **Kody błędów**: 401 Unauthorized (nieprawidłowy token)

### Dokumenty
#### Lista dokumentów
- **Metoda**: GET
- **Ścieżka**: `/documents`
- **Opis**: Pobierz wszystkie dokumenty należące do uwierzytelnionego użytkownika
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry zapytania**:
  - `page` (integer, domyślnie=1): Numer strony do paginacji
  - `limit` (integer, domyślnie=10): Liczba elementów na stronę
  - `sort_by` (string, domyślnie="upload_timestamp"): Pole do sortowania
  - `sort_order` (string, domyślnie="desc"): Kolejność sortowania ("asc" lub "desc")
- **Struktura odpowiedzi**:
```json
{
  "items": [
    {
      "id": "UUID",
      "title": "string",
      "file_size_kb": "integer",
      "upload_timestamp": "timestamp",
      "expiration_timestamp": "timestamp",
      "time_remaining": "string"
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer",
  "total_pages": "integer"
}
```
- **Kody powodzenia**: 200 OK
- **Kody błędów**: 401 Unauthorized

#### Przesyłanie dokumentu
- **Metoda**: POST
- **Ścieżka**: `/documents`
- **Opis**: Prześlij nowy dokument PDF
- **Nagłówki**: Authorization: Bearer {token}
- **Struktura żądania**: multipart/form-data
  - `file`: Plik PDF (maks. 10MB)
  - `title`: Tytuł dokumentu
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "title": "string",
  "file_size_kb": "integer",
  "upload_timestamp": "timestamp",
  "expiration_timestamp": "timestamp"
}
```
- **Kody powodzenia**: 201 Created
- **Kody błędów**:
  - 400 Bad Request (nieprawidłowy format pliku lub rozmiar)
  - 401 Unauthorized
  - 413 Payload Too Large (rozmiar pliku przekracza limit)

#### Pobierz szczegóły dokumentu
- **Metoda**: GET
- **Ścieżka**: `/documents/{document_id}`
- **Opis**: Pobierz szczegóły konkretnego dokumentu
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `document_id`: UUID dokumentu
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "title": "string",
  "file_size_kb": "integer",
  "upload_timestamp": "timestamp",
  "expiration_timestamp": "timestamp",
  "time_remaining": "string",
  "summaries": [
    {
      "id": "UUID",
      "version": "integer",
      "is_current": "boolean",
      "created_at": "timestamp"
    }
  ]
}
```
- **Kody powodzenia**: 200 OK
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (dokument nie należy do użytkownika)
  - 404 Not Found

#### Usuń dokument
- **Metoda**: DELETE
- **Ścieżka**: `/documents/{document_id}`
- **Opis**: Usuń konkretny dokument i jego podsumowania
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `document_id`: UUID dokumentu
- **Odpowiedź**: 204 No Content
- **Kody powodzenia**: 204 No Content
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (dokument nie należy do użytkownika)
  - 404 Not Found

#### Przedłuż ważność dokumentu
- **Metoda**: POST
- **Ścieżka**: `/documents/{document_id}/extend`
- **Opis**: Przedłuż czas ważności dokumentu o 24 godziny
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `document_id`: UUID dokumentu
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "expiration_timestamp": "timestamp",
  "time_remaining": "string"
}
```
- **Kody powodzenia**: 200 OK
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (dokument nie należy do użytkownika)
  - 404 Not Found

### Podsumowania
#### Generuj podsumowanie
- **Metoda**: POST
- **Ścieżka**: `/documents/{document_id}/summaries`
- **Opis**: Wygeneruj nowe podsumowanie dla dokumentu
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `document_id`: UUID dokumentu
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "document_id": "UUID",
  "content": "string",
  "version": "integer",
  "is_current": "boolean",
  "created_at": "timestamp"
}
```
- **Kody powodzenia**: 201 Created
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (dokument nie należy do użytkownika)
  - 404 Not Found
  - 422 Unprocessable Entity (dokument nie nadaje się do podsumowania)

#### Pobierz podsumowanie
- **Metoda**: GET
- **Ścieżka**: `/summaries/{summary_id}`
- **Opis**: Pobierz konkretne podsumowanie według ID
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `summary_id`: UUID podsumowania
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "document_id": "UUID",
  "document_title": "string",
  "content": "string",
  "version": "integer",
  "is_current": "boolean",
  "created_at": "timestamp",
  "feedback": {
    "is_accepted": "boolean",
    "feedback_timestamp": "timestamp"
  }
}
```
- **Kody powodzenia**: 200 OK
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (podsumowanie nie należy do użytkownika)
  - 404 Not Found

#### Aktualizuj podsumowanie
- **Metoda**: PUT
- **Ścieżka**: `/summaries/{summary_id}`
- **Opis**: Aktualizuj treść podsumowania
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `summary_id`: UUID podsumowania
- **Struktura żądania**:
```json
{
  "content": "string"
}
```
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "document_id": "UUID",
  "content": "string",
  "version": "integer",
  "is_current": "boolean",
  "created_at": "timestamp"
}
```
- **Kody powodzenia**: 200 OK
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (podsumowanie nie należy do użytkownika)
  - 404 Not Found

#### Eksportuj podsumowanie do PDF
- **Metoda**: POST
- **Ścieżka**: `/summaries/{summary_id}/export`
- **Opis**: Eksportuj podsumowanie do formatu PDF
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `summary_id`: UUID podsumowania
- **Odpowiedź**: Plik binarny PDF (Content-Type: application/pdf)
- **Kody powodzenia**: 200 OK
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (podsumowanie nie należy do użytkownika)
  - 404 Not Found
  - 500 Internal Server Error (generowanie PDF nie powiodło się)

### Oceny (Feedback)
#### Prześlij ocenę
- **Metoda**: POST
- **Ścieżka**: `/summaries/{summary_id}/feedback`
- **Opis**: Prześlij ocenę podsumowania
- **Nagłówki**: Authorization: Bearer {token}
- **Parametry ścieżki**:
  - `summary_id`: UUID podsumowania
- **Struktura żądania**:
```json
{
  "is_accepted": "boolean"
}
```
- **Struktura odpowiedzi**:
```json
{
  "id": "UUID",
  "summary_id": "UUID",
  "is_accepted": "boolean",
  "feedback_timestamp": "timestamp"
}
```
- **Kody powodzenia**: 201 Created lub 200 OK (jeśli ocena już istnieje)
- **Kody błędów**:
  - 401 Unauthorized
  - 403 Forbidden (podsumowanie nie należy do użytkownika)
  - 404 Not Found

## 3. Uwierzytelnianie i autoryzacja

### Mechanizm uwierzytelniania

SciSummarize będzie używać JWT (JSON Web Tokens) do uwierzytelniania:

1. **Generowanie tokenu**:
   - Gdy użytkownik pomyślnie się zaloguje, serwer generuje JWT zawierający identyfikator użytkownika
   - Token jest podpisywany kluczem tajnym przechowywanym na serwerze
   - Token ma czas wygaśnięcia wynoszący 1 godzinę

2. **Struktura tokenu**:
   - Nagłówek: Algorytm i typ tokenu
   - Ładunek: Identyfikator użytkownika, czas wydania, czas wygaśnięcia
   - Podpis: HMAC SHA256 nagłówka i ładunku, podpisany kluczem tajnym

3. **Użycie tokenu**:
   - Klient dołącza token w nagłówku Authorization każdego żądania
   - Format: `Authorization: Bearer {token}`

4. **Walidacja tokenu**:
   - Serwer weryfikuje podpis tokenu przy każdym żądaniu
   - Serwer sprawdza, czy token nie wygasł
   - Serwer wyodrębnia identyfikator użytkownika i ustawia go w zmiennej sesyjnej PostgreSQL za pomocą `SET app.current_user_id = '{user_id}'`

5. **Unieważnianie tokenu**:
   - Gdy użytkownik się wyloguje, token jest dodawany do czarnej listy (w pamięci lub Redis)
   - Czarna lista jest sprawdzana przy każdym żądaniu pod kątem unieważnionych tokenów

### Model autoryzacji

Aplikacja wykorzystuje Row Level Security (RLS) PostgreSQL do wymuszania autoryzacji:

1. **Polityki na poziomie wierszy**:
   - Każda tabela ma polityki RLS, które ograniczają dostęp do wierszy należących do uwierzytelnionego użytkownika
   - Funkcja `current_user_id()` jest używana w politykach do wymuszania tej izolacji

2. **Własność zasobów**:
   - Użytkownicy mogą uzyskiwać dostęp tylko do własnych zasobów (dokumentów, podsumowań, ocen)
   - Identyfikator użytkownika z JWT jest używany do określenia własności

3. **Przepływ dostępu do zasobów**:
   - Użytkownik wysyła żądanie z JWT
   - API weryfikuje token i ustawia `app.current_user_id`
   - Zapytania do bazy danych są automatycznie filtrowane przez RLS na podstawie `app.current_user_id`
   - Dostępne są tylko zasoby należące do użytkownika

## 4. Walidacja i logika biznesowa

### Reguły walidacji

#### Walidacja użytkownika
- Nazwa użytkownika musi mieć co najmniej 3 znaki (ograniczenie bazy danych)
- Nazwa użytkownika musi być unikalna (ograniczenie bazy danych)
- Hasło musi spełniać minimalne wymagania bezpieczeństwa (walidacja API)

#### Walidacja dokumentu
- Plik musi być prawidłowym PDF (walidacja API)
- Rozmiar pliku nie może przekraczać 10 MB / 10240 KB (ograniczenie bazy danych)
- Dokument musi mieć tytuł (ograniczenie bazy danych)
- Dokument musi mieć prawidłową ścieżkę pliku (ograniczenie bazy danych)

#### Walidacja podsumowania
- Podsumowanie musi mieć treść (ograniczenie bazy danych)
- Tylko jedno podsumowanie może być bieżące dla dokumentu (zarządzane przez trigger)

#### Walidacja ocen
- Tylko jedna ocena na podsumowanie (ograniczenie bazy danych)
- Ocena musi być binarna - akceptacja/odrzucenie (walidacja API)

### Implementacja logiki biznesowej

#### Zarządzanie cyklem życia dokumentu
- Dokumenty automatycznie wygasają po 24 godzinach (ustawiane przez trigger podczas przesyłania)
- Zadanie zaplanowane okresowo uruchamia funkcję `delete_expired_documents()`
- Użytkownicy mogą przedłużyć czas wygaśnięcia dokumentu w razie potrzeby

#### Zarządzanie wersjami podsumowań
- Gdy generowane jest nowe podsumowanie, staje się ono bieżącą wersją
- Poprzednie wersje są oznaczane jako nieaktualne (zarządzane przez trigger)
- Flaga `is_current` umożliwia szybki dostęp do najnowszej wersji

#### Potok przetwarzania tekstu
1. **Przesyłanie dokumentu**:
   - Walidacja formatu i rozmiaru PDF
   - Przechowywanie w systemie plików z bezpieczną ścieżką
   - Zapis metadanych w bazie danych

2. **Generowanie podsumowania**:
   - Wyodrębnienie tekstu z PDF za pomocą PyMuPDF
   - Przetwarzanie tekstu przy użyciu modelu SciBert
   - Przechowywanie wygenerowanego podsumowania w bazie danych
   - Zastosowanie logiki zarządzania wersjami

3. **Eksport podsumowania**:
   - Formatowanie treści podsumowania zgodnie z preferencjami użytkownika
   - Generowanie dokumentu PDF
   - Strumieniowanie do użytkownika do pobrania

#### Implementacja zabezpieczeń
- Użycie UUID zamiast sekwencyjnych ID, aby zapobiec atakom enumeracyjnym
- Row Level Security na poziomie bazy danych, aby zapewnić izolację danych
- Walidacja danych wejściowych we wszystkich punktach końcowych, aby zapobiec atakom iniekcyjnym
- Ograniczanie szybkości na punktach końcowych uwierzytelniania, aby zapobiec atakom brute force