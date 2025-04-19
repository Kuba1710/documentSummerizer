# Architektura UI dla SciSummarize

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika SciSummarize składa się z pięciu głównych widoków zorganizowanych w logiczną ścieżkę użytkownika. Aplikacja wykorzystuje przede wszystkim układ dwukolumnowy dla kluczowych funkcjonalności, z naciskiem na prostotę i jasność interakcji. Widoki są zintegrowane z API za pomocą HTMX, co pozwala na asynchroniczną komunikację bez przeładowywania strony. Kolorystyka oparta jest na jasnych barwach pastelowych, a nawigacja zaprojektowana jest w sposób minimalistyczny, aby nie odwracać uwagi od głównych funkcjonalności aplikacji.

## 2. Lista widoków

### 2.1. Logowanie/Rejestracja
- **Ścieżka widoku**: `/auth` (domyślna ścieżka dla niezalogowanych)
- **Główny cel**: Umożliwienie użytkownikom utworzenia konta lub zalogowania się do systemu
- **Kluczowe informacje**:
  - Formularz logowania (login, hasło)
  - Formularz rejestracji (login, hasło)
  - Komunikaty walidacji i błędów
- **Kluczowe komponenty**:
  - Przełącznik między formularzami logowania i rejestracji
  - Przyciski akcji (Zaloguj, Zarejestruj)
  - Komunikaty błędów (jednozdaniowe)
- **UX, dostępność i bezpieczeństwo**:
  - Jasne, jednoznaczne komunikaty błędów
  - Bezpieczne przesyłanie danych uwierzytelniających
  - Walidacja pól formularza w czasie rzeczywistym
  - Obsługa błędów uwierzytelniania (np. nazwa użytkownika zajęta)

### 2.2. Strona Główna (dla zalogowanych)
- **Ścieżka widoku**: `/`
- **Główny cel**: Umożliwienie uploadowania plików PDF do podsumowania
- **Kluczowe informacje**:
  - Obszar uploadu plików
  - Informacja o ograniczeniach (format PDF, max 10MB)
  - Wskaźnik postępu uploadu i przetwarzania
- **Kluczowe komponenty**:
  - Obszar drag-and-drop do uploadu plików
  - Przycisk "Przeglądaj pliki"
  - Animowany wskaźnik postępu (kręcące się kółko)
  - Komunikaty błędów walidacji
- **UX, dostępność i bezpieczeństwo**:
  - Proste instrukcje użytkowania
  - Walidacja formatu i rozmiaru pliku przed wysłaniem
  - Wyraźne wskazanie postępu procesu
  - Zabezpieczenie przed wielokrotnym uploadem tego samego pliku

### 2.3. Lista Dokumentów
- **Ścieżka widoku**: `/documents`
- **Główny cel**: Prezentacja wszystkich dokumentów użytkownika i zarządzanie nimi
- **Kluczowe informacje**:
  - Tytuł dokumentu
  - Data dodania (dd-mm-rr)
  - Czas pozostały do wygaśnięcia
  - Dostępne akcje dla dokumentu
- **Kluczowe komponenty**:
  - Tabela/lista dokumentów
  - Opcja sortowania po dacie dodania
  - Przyciski akcji dla każdego dokumentu (Otwórz, Usuń)
  - Okno dialogowe potwierdzenia usunięcia
- **UX, dostępność i bezpieczeństwo**:
  - Wyraźne oznaczenie dokumentów zbliżających się do wygaśnięcia
  - Potwierdzenie przed nieodwracalnymi akcjami (usunięcie)
  - Możliwość łatwego powrotu do generowania nowego podsumowania

### 2.4. Edycja/Podgląd Podsumowania
- **Ścieżka widoku**: `/summaries/{summary_id}`
- **Główny cel**: Umożliwienie przeglądania i edycji wygenerowanego podsumowania
- **Kluczowe informacje**:
  - Podgląd oryginalnego dokumentu PDF
  - Wygenerowane podsumowanie
  - Narzędzia formatowania
  - Licznik słów/znaków
  - Status automatycznego zapisywania
- **Kluczowe komponenty**:
  - Dwukolumnowy układ (PDF po lewej, edytor po prawej)
  - Pasek narzędzi formatowania (pogrubienie, rozmiar czcionki, kolor czcionki)
  - Licznik słów/znaków aktualizowany w czasie rzeczywistym
  - Wskaźnik autosave
  - Przyciski oceny jakości podsumowania (pozytywna/negatywna)
  - Przycisk "Eksportuj do PDF"
- **UX, dostępność i bezpieczeństwo**:
  - Automatyczne zapisywanie zmian co 10 sekund
  - Wyraźne komunikaty o statusie zapisywania
  - Zachęta do oceny jakości podsumowania
  - Łatwa nawigacja między oryginalnym dokumentem a podsumowaniem

### 2.5. Podgląd Przed Eksportem
- **Ścieżka widoku**: `/summaries/{summary_id}/preview-export`
- **Główny cel**: Prezentacja finalnej wersji podsumowania w formacie PDF przed pobraniem
- **Kluczowe informacje**:
  - Podgląd wygenerowanego PDF
  - Opcje zatwierdzenia lub powrotu do edycji
- **Kluczowe komponenty**:
  - Pełnoekranowy podgląd PDF
  - Przyciski "Wróć do edycji" i "Pobierz PDF"
- **UX, dostępność i bezpieczeństwo**:
  - Wyraźne przyciski akcji
  - Możliwość weryfikacji wyglądu przed finalnym eksportem
  - Zabezpieczenie przed przypadkowym opuszczeniem strony

## 3. Mapa podróży użytkownika

### 3.1. Rejestracja i logowanie
1. Użytkownik wchodzi na stronę aplikacji
2. Widzi formularz logowania
3. Może przełączyć na formularz rejestracji, jeśli nie ma konta
4. Po rejestracji/logowaniu jest przekierowywany na stronę główną

### 3.2. Upload i generowanie podsumowania
1. Zalogowany użytkownik widzi stronę główną z komponentem uploadu
2. Użytkownik wybiera plik PDF (przez drag-and-drop lub przycisk "Przeglądaj")
3. System waliduje format i rozmiar pliku
4. Po poprawnej walidacji automatycznie rozpoczyna się upload
5. Następnie automatycznie rozpoczyna się proces generowania podsumowania
6. Użytkownik widzi wskaźnik postępu (kręcące się kółko)
7. Po zakończeniu generowania użytkownik jest przekierowywany do widoku edycji podsumowania

### 3.3. Zarządzanie dokumentami
1. Użytkownik przechodzi do widoku listy dokumentów z nagłówka
2. Przeglądając listę, może sortować dokumenty według daty dodania
3. Dla każdego dokumentu widzi czas pozostały do wygaśnięcia
4. Może otworzyć dokument do edycji podsumowania lub usunąć dokument
5. Przed usunięciem system prosi o potwierdzenie

### 3.4. Edycja i ocena podsumowania
1. W widoku edycji użytkownik widzi podgląd oryginalnego PDF po lewej
2. Po prawej znajduje się edytor podsumowania z narzędziami formatowania
3. Użytkownik może edytować tekst i formatować go
4. Zmiany są automatycznie zapisywane co 10 sekund
5. Licznik słów/znaków aktualizuje się w czasie rzeczywistym
6. Użytkownik może ocenić jakość podsumowania (pozytywnie/negatywnie)
7. Po zakończeniu edycji może wybrać opcję eksportu do PDF

### 3.5. Eksport i pobranie PDF
1. Po wybraniu opcji eksportu użytkownik jest przekierowywany do widoku podglądu
2. Widzi wygenerowany PDF z formatowaniem
3. Może wrócić do edycji lub zatwierdzić i pobrać PDF
4. Po pobraniu może wrócić do listy dokumentów lub edycji

## 4. Układ i struktura nawigacji

### 4.1. Nagłówek (dla zalogowanych użytkowników)
- Logo/nazwa aplikacji po lewej (link do strony głównej)
- Przycisk "Moje dokumenty" (link do listy dokumentów)
- Przycisk "Wyloguj" po prawej

### 4.2. Nawigacja kontekstowa
- W widoku edycji: przycisk powrotu do listy dokumentów
- W widoku podglądu przed eksportem: przyciski "Wróć do edycji" i "Pobierz PDF"

### 4.3. Struktura przepływu
- Logowanie/Rejestracja → Strona główna → Edycja podsumowania → Podgląd przed eksportem
- Dostęp do listy dokumentów możliwy z każdego widoku przez nagłówek
- Z listy dokumentów możliwe przejście do konkretnego podsumowania

## 5. Kluczowe komponenty

### 5.1. Komponent uploadu plików
- Obsługuje drag-and-drop
- Umożliwia wybór pliku przez przeglądarkę
- Waliduje format i rozmiar pliku
- Wyświetla wskaźnik postępu uploadu

### 5.2. Wskaźnik postępu
- Animowane kręcące się kółko
- Wyświetlany podczas procesów asynchronicznych (upload, generowanie podsumowania)
- Zapewnia informację zwrotną o trwających procesach

### 5.3. Edytor tekstu
- Prosty interfejs z podstawowymi narzędziami formatowania
- Przyciski formatowania zawsze widoczne nad obszarem edycji
- Licznik słów/znaków aktualizowany w czasie rzeczywistym
- Wskaźnik statusu autosave

### 5.4. Przeglądarka PDF
- Wyświetla oryginalny dokument PDF w lewej kolumnie widoku edycji
- Umożliwia przewijanie i przeglądanie dokumentu
- Wyświetla podgląd eksportowanego PDF w widoku przed pobraniem

### 5.5. Komponent oceny
- Dwa przyciski: pozytywna i negatywna ocena
- Krótki tekst zachęcający do oceny
- Informacja zwrotna po dokonaniu oceny

### 5.6. Komunikaty o błędach
- Jednozdaniowe, jasne komunikaty
- Wyświetlane bezpośrednio przy komponencie, którego dotyczą
- Zawierają informację o przyczynie błędu 