# Plan implementacji widoku Edycja/Podgląd Podsumowania

## 1. Przegląd
Widok Edycji/Podglądu Podsumowania to kluczowy element aplikacji SciSummarize, umożliwiający użytkownikom przeglądanie, edycję i formatowanie automatycznie wygenerowanych podsumowań dokumentów naukowych. Układ dwukolumnowy pozwala na jednoczesne przeglądanie oryginalnego dokumentu PDF i edycję jego podsumowania.

## 2. Routing widoku
- **Ścieżka**: `/summaries/{summary_id}`
- **Parametry**: `summary_id` - identyfikator UUID podsumowania

## 3. Struktura komponentów
```
SummaryEditorPage
├── Header (nawigacja)
├── PDFViewer (lewa kolumna)
└── SummaryEditorPanel (prawa kolumna)
    ├── FormattingToolbar
    ├── SummaryTextEditor
    ├── WordCounter
    ├── AutoSaveIndicator
    ├── FeedbackComponent
    └── ExportButton
```

## 4. Szczegóły komponentów

### SummaryEditorPage
- **Opis komponentu**: Główny kontener widoku, odpowiedzialny za układ dwukolumnowy i koordynację komunikacji z API. Obsługuje pobieranie danych podsumowania i dokumentu PDF.
- **Główne elementy**: 
  - Kontener dwukolumnowy (`<div class="grid grid-cols-2">`)
  - Header z nawigacją (`<header>`)
  - PDFViewer (lewa kolumna)
  - SummaryEditorPanel (prawa kolumna)
- **Obsługiwane interakcje**: 
  - Inicjalizacja widoku (pobranie danych podsumowania i dokumentu)
  - Obsługa nawigacji
- **Obsługiwana walidacja**: 
  - Sprawdzenie, czy podsumowanie istnieje
  - Weryfikacja uprawnień użytkownika do podsumowania
- **Typy**: 
  - `SummaryDTO`
  - `DocumentDTO`
- **Propsy**: Brak (komponent najwyższego poziomu)

### PDFViewer
- **Opis komponentu**: Wyświetla oryginalny dokument PDF, umożliwiając jego przeglądanie.
- **Główne elementy**: 
  - Kontener PDF (`<div>`)
  - Obiekt PDF (`<object type="application/pdf">` lub `<iframe>`)
  - Kontrolki przewijania
- **Obsługiwane interakcje**: 
  - Przewijanie dokumentu
  - Zmiana rozmiaru widoku
- **Obsługiwana walidacja**: 
  - Sprawdzenie, czy dokument PDF jest dostępny
- **Typy**: 
  - `DocumentDTO`
- **Propsy**: 
  - `documentUrl: string` - URL do pobrania dokumentu PDF
  - `documentTitle: string` - Tytuł dokumentu

### SummaryEditorPanel
- **Opis komponentu**: Panel zawierający edytor podsumowania i związane z nim narzędzia.
- **Główne elementy**: 
  - FormattingToolbar
  - SummaryTextEditor
  - WordCounter
  - AutoSaveIndicator
  - FeedbackComponent
  - ExportButton
- **Obsługiwane interakcje**: 
  - Koordynacja akcji edycji
  - Przekazywanie zmian do API
- **Obsługiwana walidacja**: 
  - Weryfikacja niepustości treści podsumowania
- **Typy**: 
  - `SummaryDTO`
  - `UpdateSummaryDTO`
- **Propsy**: 
  - `summary: SummaryDTO` - Dane podsumowania
  - `onSummaryUpdate: (content: string) => Promise<void>` - Funkcja aktualizacji podsumowania

### FormattingToolbar
- **Opis komponentu**: Pasek narzędzi do formatowania tekstu podsumowania.
- **Główne elementy**: 
  - Przyciski formatowania (`<button>`)
  - Opcje rozmiaru czcionki (`<select>`)
  - Selektor koloru (`<input type="color">`)
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku formatowania (pogrubienie)
  - Zmiana rozmiaru czcionki
  - Zmiana koloru czcionki
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: 
  - `onFormat: (formatType: string, value?: string) => void` - Funkcja callback do formatowania tekstu

### SummaryTextEditor
- **Opis komponentu**: Edytor tekstu podsumowania z obsługą formatowania i autosave.
- **Główne elementy**: 
  - Edytowalny div (`<div contenteditable="true">`)
- **Obsługiwane interakcje**: 
  - Edycja tekstu
  - Formatowanie tekstu
- **Obsługiwana walidacja**: 
  - Niepustość zawartości
- **Typy**: 
  - `UpdateSummaryDTO`
- **Propsy**: 
  - `content: string` - Treść podsumowania
  - `onChange: (content: string) => void` - Funkcja wywołana przy zmianie zawartości
  - `onContentUpdate: () => void` - Funkcja wywoływana podczas aktualizacji zawartości (autosave)

### WordCounter
- **Opis komponentu**: Komponent wyświetlający liczbę słów i znaków w podsumowaniu.
- **Główne elementy**: 
  - Licznik słów (`<span>`)
  - Licznik znaków (`<span>`)
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: 
  - `content: string` - Treść do analizy
  - `updateInterval: number` - Częstotliwość aktualizacji (ms), domyślnie 500ms

### AutoSaveIndicator
- **Opis komponentu**: Wskaźnik statusu automatycznego zapisywania podsumowania.
- **Główne elementy**: 
  - Ikona statusu (`<span>`)
  - Tekst statusu (`<span>`)
  - Timestamp ostatniego zapisu (`<small>`)
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: 
  - `isSaving: boolean` - Czy trwa zapisywanie
  - `lastSavedTime: string | null` - Czas ostatniego zapisu

### FeedbackComponent
- **Opis komponentu**: Komponent umożliwiający binarną ocenę jakości podsumowania.
- **Główne elementy**: 
  - Tekst zachęty (`<p>`)
  - Przycisk pozytywnej oceny (`<button>`)
  - Przycisk negatywnej oceny (`<button>`)
  - Potwierdzenie zapisania oceny (`<div>`)
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku oceny pozytywnej/negatywnej
- **Obsługiwana walidacja**: Brak
- **Typy**: 
  - `FeedbackDTO`
- **Propsy**: 
  - `summaryId: string` - ID podsumowania
  - `currentFeedback: boolean | null` - Aktualna ocena (jeśli istnieje)
  - `onFeedbackSubmit: (isAccepted: boolean) => Promise<void>` - Funkcja przesyłająca ocenę

### ExportButton
- **Opis komponentu**: Przycisk umożliwiający eksport podsumowania do formatu PDF.
- **Główne elementy**: 
  - Przycisk eksportu (`<button>`)
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku eksportu
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: 
  - `summaryId: string` - ID podsumowania
  - `onExport: () => void` - Funkcja przekierowująca do widoku podglądu

## 5. Typy

### SummaryDTO
```typescript
// Reprezentacja podsumowania z API
interface SummaryDTO {
  id: string;                // UUID
  document_id: string;       // UUID
  document_title: string;
  content: string;
  version: number;
  is_current: boolean;
  created_at: string;        // timestamp
  feedback?: {
    is_accepted: boolean;
    feedback_timestamp: string; // timestamp
  }
}
```

### DocumentDTO
```typescript
// Reprezentacja dokumentu źródłowego
interface DocumentDTO {
  id: string;                // UUID
  title: string;
  file_path: string;
  file_size_kb: number;
  upload_timestamp: string;  // timestamp
  expiration_timestamp: string; // timestamp
  time_remaining: string;
}
```

### UpdateSummaryDTO
```typescript
// Dane do aktualizacji podsumowania
interface UpdateSummaryDTO {
  content: string;
}
```

### FeedbackDTO
```typescript
// Dane do przesłania oceny podsumowania
interface FeedbackDTO {
  is_accepted: boolean;
}
```

### SummaryEditorViewModel
```typescript
// Model widoku edytora podsumowania
interface SummaryEditorViewModel {
  summary: SummaryDTO;
  isSaving: boolean;
  lastSaved: string | null;  // timestamp
  wordCount: number;
  charCount: number;
  hasFeedback: boolean;
  feedbackAccepted?: boolean;
}
```

## 6. Zarządzanie stanem

### Główne zmienne stanu:
- **summary**: Dane podsumowania pobrane z API
- **isSaving**: Czy trwa zapisywanie podsumowania
- **lastSaved**: Czas ostatniego zapisu podsumowania
- **wordCount**: Liczba słów w podsumowaniu
- **charCount**: Liczba znaków w podsumowaniu

### Autosave:
Implementacja autosave wykonywana jest z wykorzystaniem timera:
```javascript
let autosaveTimer;
let lastContent = "";

function setupAutosave(content, updateFunction) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  
  autosaveTimer = setTimeout(() => {
    if (content !== lastContent) {
      updateFunction(content);
      lastContent = content;
    }
  }, 10000); // 10 sekund
}
```

### Obsługa HTMX:
W przypadku korzystania z HTMX, główne akcje (pobieranie i zapisywanie) wykonywane są przez:
1. Atrybuty `hx-get` i `hx-put` dla odpowiednich endpointów
2. Aktualizację elementów poprzez `hx-target`
3. Wyzwalanie aktualizacji poprzez `hx-trigger="every 10s"`

## 7. Integracja API

### Pobieranie podsumowania:
```html
<!-- Pobieranie podsumowania przy ładowaniu strony -->
<div hx-get="/api/summaries/{summary_id}" 
     hx-trigger="load"
     hx-target="#editor-container">
</div>
```

### Aktualizacja podsumowania (autosave):
```html
<!-- Automatyczne zapisywanie co 10 sekund -->
<div hx-put="/api/summaries/{summary_id}" 
     hx-trigger="autosave from:body"
     hx-include="#summary-content"
     hx-target="#save-indicator">
```

### Przesyłanie oceny:
```html
<!-- Przesyłanie pozytywnej oceny -->
<button hx-post="/api/summaries/{summary_id}/feedback"
        hx-vals='{"is_accepted": true}'
        hx-target="#feedback-result">
  Pozytywna ocena
</button>
```

### Eksport do PDF:
```html
<!-- Przekierowanie do widoku podglądu eksportu -->
<a hx-get="/summaries/{summary_id}/preview-export"
   hx-push-url="true">
  Eksportuj do PDF
</a>
```

## 8. Interakcje użytkownika

### Interakcja 1: Edycja tekstu podsumowania
1. Użytkownik klika w obszar edycji
2. Użytkownik wprowadza zmiany w tekście
3. System aktualizuje liczniki słów i znaków
4. Po 10 sekundach (lub bezczynności) system automatycznie zapisuje zmiany
5. System wyświetla status zapisywania

### Interakcja 2: Formatowanie tekstu
1. Użytkownik zaznacza fragment tekstu
2. Użytkownik klika przycisk formatowania (np. pogrubienie)
3. System aplikuje wybrany styl do zaznaczonego tekstu
4. Autosave zapisuje zmiany po 10 sekundach

### Interakcja 3: Ocena podsumowania
1. Użytkownik przegląda wygenerowane podsumowanie
2. Użytkownik klika przycisk pozytywnej lub negatywnej oceny
3. System wysyła ocenę do API
4. System wyświetla potwierdzenie zapisania oceny

### Interakcja 4: Eksport do PDF
1. Użytkownik klika przycisk "Eksportuj do PDF"
2. System przekierowuje użytkownika do widoku podglądu przed pobraniem
3. W widoku podglądu użytkownik może wrócić do edycji lub pobrać finalny PDF

## 9. Warunki i walidacja

### Walidacja treści podsumowania:
- Podsumowanie nie może być puste przy zapisywaniu
```javascript
function validateSummaryContent(content) {
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  return textContent.length > 0;
}
```

### Warunki dla autosave:
- Zapisywanie tylko gdy treść uległa zmianie
- Minimalny odstęp czasowy między zapisami (10 sekund)

### Walidacja uprawnień:
- Sprawdzenie czy użytkownik ma dostęp do danego podsumowania (obsługiwane przez API)

## 10. Obsługa błędów

### Scenariusz 1: Błąd pobierania podsumowania
- Wyświetlenie komunikatu o błędzie: "Nie udało się pobrać podsumowania. Spróbuj odświeżyć stronę."
- Przycisk odświeżania strony
- Opcja powrotu do listy dokumentów

### Scenariusz 2: Błąd zapisywania podsumowania
- Wyświetlenie komunikatu: "Wystąpił problem z zapisaniem zmian. Spróbujemy ponownie za chwilę."
- Automatyczna ponowna próba zapisania po 30 sekundach
- Przechowywanie treści lokalnie w sessionStorage jako zabezpieczenie

### Scenariusz 3: Wygasła sesja
- Przechwycenie błędu 401 z API
- Wyświetlenie komunikatu: "Twoja sesja wygasła. Zaloguj się ponownie."
- Przekierowanie do strony logowania
- Zapisanie stanu edycji w sessionStorage

### Scenariusz 4: Brak dostępu do dokumentu PDF
- Wyświetlenie komunikatu: "Nie można wyświetlić oryginalnego dokumentu. Może on nie istnieć lub wygasł."
- Umożliwienie kontynuowania edycji podsumowania

## 11. Kroki implementacji

1. **Utworzenie szablonów HTML z Jinja2**
   - Utworzenie głównego szablonu strony (`summary_editor.html`)
   - Dodanie struktury dwukolumnowej
   - Implementacja nagłówka z nawigacją

2. **Implementacja komponentu PDFViewer**
   - Dodanie obsługi wyświetlania PDF
   - Konfiguracja parametrów wyświetlania dokumentu

3. **Implementacja SummaryEditorPanel**
   - Utworzenie edytowalnego pola z początkową zawartością podsumowania
   - Implementacja mechanizmu śledzenia zmian

4. **Implementacja FormattingToolbar**
   - Dodanie przycisków formatowania
   - Połączenie akcji formatowania z edytorem

5. **Implementacja WordCounter**
   - Dodanie mechanizmu liczenia słów i znaków
   - Integracja z edytorem

6. **Implementacja AutoSaveIndicator**
   - Dodanie wskaźnika statusu zapisywania
   - Implementacja logiki autosave

7. **Implementacja FeedbackComponent**
   - Dodanie przycisków oceny
   - Implementacja logiki przesyłania oceny

8. **Implementacja ExportButton**
   - Dodanie przycisku eksportu
   - Konfiguracja przekierowania do widoku podglądu

9. **Integracja z API**
   - Konfiguracja atrybutów HTMX dla pobierania danych
   - Implementacja aktualizacji podsumowania
   - Implementacja przesyłania oceny

10. **Testowanie i obsługa błędów**
    - Implementacja obsługi typowych błędów
    - Testowanie wszystkich interakcji użytkownika
    - Weryfikacja poprawności integracji z API
``` 