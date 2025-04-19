# Dokument wymagań produktu (PRD) - SciSummarize

## 1. Przegląd produktu

SciSummarize to webowa aplikacja zaprojektowana w celu automatycznego podsumowywania tekstów naukowych i akademickich. Narzędzie wykorzystuje sztuczną inteligencję (model SciBert) do analizy dokumentów PDF i generowania zwięzłych podsumowań, które zachowują kluczowe informacje z oryginalnego tekstu.

Główne cechy produktu:
- Automatyczne podsumowywanie tekstów akademickich w dowolnym języku
- Zachowanie kluczowych elementów: metodologii, wyników, wniosków i danych statystycznych
- Edycja i formatowanie wygenerowanych podsumowań
- Eksport podsumowań do formatu PDF
- Prosty system kont użytkowników

SciSummarize jest skierowany głównie do studentów, badaczy i naukowców, którzy potrzebują szybkiego dostępu do najważniejszych informacji zawartych w publikacjach naukowych, bez konieczności czytania całych dokumentów.

## 2. Problem użytkownika

Czytanie całych tekstów naukowych i dokumentów akademickich jest czasochłonne. Wielu użytkowników potrzebuje jedynie najważniejszych informacji zawartych w tych materiałach, takich jak:
- Zastosowana metodologia badawcza
- Kluczowe wyniki i odkrycia
- Główne wnioski
- Istotne dane statystyczne
- Bibliografia i cytowania

Nasi użytkownicy (studenci, naukowcy, badacze) często muszą zapoznać się z dużą ilością materiałów w krótkim czasie. Potrzebują narzędzia, które:
- Zaoszczędzi im czas spędzony na czytaniu
- Wyodrębni najważniejsze informacje z tekstu
- Zachowa oryginalny sens i kontekst dokumentu
- Umożliwi łatwy dostęp do podsumowań

SciSummarize rozwiązuje ten problem, oferując automatyczne podsumowania dokumentów, które można dostosować do własnych potrzeb i zapisać w formie pliku PDF.

## 3. Wymagania funkcjonalne

### 3.1 Upload dokumentów

- System będzie akceptować pliki PDF o maksymalnym rozmiarze 10 MB
- System będzie obsługiwać tylko dokumenty zawierające tekst cyfrowy (bez OCR)
- System będzie obsługiwać dokumenty w dowolnym języku
- System będzie zachowywać oryginalne wzory matematyczne i symbole w takiej formie, jak występują w tekście

### 3.2 Przetwarzanie i podsumowywanie

- System będzie wykorzystywać model AI SciBert do generowania podsumowań
- System będzie identyfikować i wyodrębniać kluczowe elementy: metodologię, wyniki, wnioski i dane statystyczne
- System będzie zachowywać oryginalne cytowania i odniesienia bibliograficzne
- System będzie generować podsumowania w języku oryginalnego dokumentu
- System nie będzie ograniczał długości generowanych podsumowań

### 3.3 Edycja i formatowanie

- System umożliwi użytkownikom edycję wygenerowanych podsumowań
- System zapewni opcje formatowania podobne do programu Word:
  - Zmiana rozmiaru czcionki
  - Zmiana rodzaju czcionki
  - Zastosowanie stylów (pogrubienie, kursywa, podkreślenie)
  - Wyrównanie tekstu
  - Tworzenie list numerowanych i punktowanych

### 3.4 Eksport

- System umożliwi eksport podsumowań do formatu PDF
- System zachowa zastosowane formatowanie w eksportowanym pliku

### 3.5 System kont użytkowników

- System będzie wymagał rejestracji i logowania (login i hasło)
- System będzie przechowywał dokumenty użytkowników przez 24 godziny, po czym zostaną one automatycznie usunięte
- System nie będzie ograniczał liczby dokumentów, które użytkownik może przechowywać

### 3.6 Feedback

- System umożliwi użytkownikom dostarczenie binarnej oceny jakości podsumowania (akceptacja/odrzucenie)
- System będzie zbierał dane o akceptacji podsumowań w celu mierzenia skuteczności

## 4. Granice produktu

W zakres MVP (Minimum Viable Product) NIE wchodzą następujące funkcjonalności:

### 4.1 Funkcjonalności wykluczone z MVP

- Import dokumentów w formatach innych niż PDF (DOCX, TXT, itp.)
- Współdzielenie tekstów i podsumowań między użytkownikami
- Aplikacje mobilne (tylko aplikacja webowa)
- Przetwarzanie skanowanych dokumentów (OCR)
- Uczenie się systemu z feedbacku użytkowników
- Kategoryzacja lub tagowanie dokumentów
- Wersjonowanie podsumowań
- Wybór konkretnych części dokumentu do podsumowania
- Zaawansowane funkcje bezpieczeństwa
- Wyszukiwanie w przechowywanych dokumentach i podsumowaniach
- Dodawanie własnych notatek do podsumowań

### 4.2 Ograniczenia techniczne

- Prosta aplikacja webowa napisana w Pythonie
- Brak obsługi skanowanych dokumentów (tylko tekst cyfrowy)
- Brak zaawansowanych funkcji bezpieczeństwa na poziomie MVP
- Brak uczenia się systemu z feedbacku użytkowników

## 5. Historyjki użytkowników

### US-001: Rejestracja konta użytkownika
- Tytuł: Rejestracja nowego konta
- Opis: Jako nowy użytkownik, chcę zarejestrować konto w systemie, aby móc korzystać z funkcji podsumowywania dokumentów.
- Kryteria akceptacji:
  - Formularz rejestracyjny zawiera pola: login i hasło
  - System weryfikuje, czy login nie jest już zajęty
  - System weryfikuje, czy hasło spełnia minimalne wymagania bezpieczeństwa
  - Po udanej rejestracji użytkownik jest przekierowywany na stronę logowania
  - System wyświetla odpowiedni komunikat w przypadku błędów

### US-002: Logowanie do konta
- Tytuł: Logowanie do istniejącego konta
- Opis: Jako zarejestrowany użytkownik, chcę zalogować się do swojego konta, aby uzyskać dostęp do moich dokumentów i podsumowań.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola: login i hasło
  - System weryfikuje poprawność danych logowania
  - Po udanym logowaniu użytkownik jest przekierowywany na stronę główną aplikacji
  - System wyświetla odpowiedni komunikat w przypadku błędnego logowania

### US-003: Wylogowanie z konta
- Tytuł: Wylogowanie z konta
- Opis: Jako zalogowany użytkownik, chcę wylogować się z mojego konta, aby zakończyć sesję i zabezpieczyć moje dane.
- Kryteria akceptacji:
  - Opcja wylogowania jest łatwo dostępna z każdego ekranu aplikacji
  - Po wylogowaniu użytkownik jest przekierowywany na stronę logowania
  - Po wylogowaniu sesja użytkownika jest zamykana i nie ma on dostępu do chronionych zasobów

### US-004: Upload dokumentu PDF
- Tytuł: Dodanie dokumentu PDF do systemu
- Opis: Jako zalogowany użytkownik, chcę dodać dokument PDF do systemu, aby mógł zostać podsumowany.
- Kryteria akceptacji:
  - System umożliwia wybór pliku PDF z lokalnego dysku
  - System weryfikuje, czy plik ma format PDF
  - System weryfikuje, czy rozmiar pliku nie przekracza 10 MB
  - System wyświetla komunikat o postępie uploadu
  - System informuje o zakończeniu uploadu i przejściu do etapu przetwarzania

### US-005: Podsumowanie dokumentu
- Tytuł: Generowanie podsumowania dokumentu
- Opis: Jako zalogowany użytkownik, chcę zlecić systemowi podsumowanie dodanego dokumentu PDF, aby otrzymać jego zwięzłą wersję.
- Kryteria akceptacji:
  - System rozpoczyna proces podsumowywania po zakończeniu uploadu dokumentu
  - System wyświetla informację o postępie przetwarzania
  - System generuje podsumowanie zawierające metodologię, wyniki, wnioski i dane statystyczne
  - System zachowuje oryginalne cytowania i odniesienia
  - System zachowuje wzory matematyczne i symbole w oryginalnej formie
  - Po zakończeniu przetwarzania system prezentuje wygenerowane podsumowanie

### US-006: Podgląd wygenerowanego podsumowania
- Tytuł: Przeglądanie wygenerowanego podsumowania
- Opis: Jako zalogowany użytkownik, chcę zobaczyć wygenerowane podsumowanie, aby ocenić jego jakość i przydatność.
- Kryteria akceptacji:
  - System wyświetla podsumowanie w czytelnym formacie
  - System umożliwia przewijanie dłuższych podsumowań
  - System wyświetla informacje o oryginalnym dokumencie (tytuł, rozmiar)

### US-007: Edycja podsumowania
- Tytuł: Edycja wygenerowanego podsumowania
- Opis: Jako zalogowany użytkownik, chcę edytować wygenerowane podsumowanie, aby dostosować je do moich potrzeb.
- Kryteria akceptacji:
  - System udostępnia edytor tekstu do modyfikacji podsumowania
  - System zachowuje zmiany wprowadzone przez użytkownika
  - System umożliwia cofnięcie zmian i powrót do oryginalnego podsumowania

### US-008: Formatowanie podsumowania
- Tytuł: Formatowanie wygenerowanego podsumowania
- Opis: Jako zalogowany użytkownik, chcę formatować wygenerowane podsumowanie, aby poprawić jego czytelność i wygląd.
- Kryteria akceptacji:
  - System udostępnia narzędzia do zmiany rozmiaru i rodzaju czcionki
  - System udostępnia narzędzia do zastosowania stylów (pogrubienie, kursywa, podkreślenie)
  - System udostępnia narzędzia do wyrównania tekstu
  - System udostępnia narzędzia do tworzenia list numerowanych i punktowanych
  - System umożliwia podgląd formatowania w czasie rzeczywistym

### US-009: Eksport podsumowania do PDF
- Tytuł: Eksport podsumowania do pliku PDF
- Opis: Jako zalogowany użytkownik, chcę eksportować wygenerowane podsumowanie do pliku PDF, aby móc je przechowywać i udostępniać.
- Kryteria akceptacji:
  - System generuje plik PDF zawierający podsumowanie z zachowanym formatowaniem
  - System umożliwia pobranie wygenerowanego pliku PDF
  - System informuje o zakończeniu procesu generowania PDF

### US-010: Ocena jakości podsumowania
- Tytuł: Dostarczenie feedbacku na temat podsumowania
- Opis: Jako zalogowany użytkownik, chcę ocenić jakość wygenerowanego podsumowania, aby pomóc w mierzeniu skuteczności systemu.
- Kryteria akceptacji:
  - System umożliwia binarną ocenę podsumowania (akceptacja/odrzucenie)
  - System rejestruje i przechowuje ocenę użytkownika
  - System wyświetla potwierdzenie zapisania oceny

### US-011: Przeglądanie listy dokumentów
- Tytuł: Przeglądanie listy dodanych dokumentów
- Opis: Jako zalogowany użytkownik, chcę przeglądać listę dodanych przeze mnie dokumentów, aby mieć dostęp do ich podsumowań.
- Kryteria akceptacji:
  - System wyświetla listę dokumentów dodanych przez użytkownika
  - Lista zawiera podstawowe informacje o dokumentach (nazwa, data dodania)
  - System informuje o czasie pozostałym do automatycznego usunięcia dokumentów
  - System umożliwia filtrowanie i sortowanie listy dokumentów

### US-012: Usuwanie dokumentu
- Tytuł: Usuwanie dokumentu z systemu
- Opis: Jako zalogowany użytkownik, chcę usunąć dodany przeze mnie dokument, aby zarządzać przestrzenią w moim koncie.
- Kryteria akceptacji:
  - System umożliwia usunięcie wybranego dokumentu z listy
  - System wyświetla potwierdzenie przed usunięciem dokumentu
  - System informuje o skutecznym usunięciu dokumentu
  - Po usunięciu dokument nie jest już dostępny dla użytkownika

## 6. Metryki sukcesu

### 6.1 Główna metryką sukcesu
- 75% podsumowanych tekstów jest akceptowane przez użytkowników (mierzone przez system binarnego feedbacku)

### 6.2 Dodatkowe metryki
- Czas spędzony przez użytkowników na przeglądaniu podsumowań
- Liczba eksportowanych podsumowań do PDF
- Częstotliwość korzystania z funkcji edycji podsumowań
- Czas potrzebny na wygenerowanie podsumowania
- Liczba powtórnych podsumowań tego samego dokumentu 