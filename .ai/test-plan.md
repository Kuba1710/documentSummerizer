# Plan Testów - Projekt Document Summarizer

## 1. Wprowadzenie i cele testowania

Celem testowania jest zapewnienie wysokiej jakości aplikacji Document Summarizer, która umożliwia podsumowywanie dokumentów naukowych z wykorzystaniem AI. Proces testowania ma na celu:
- Weryfikację zgodności z wymaganiami funkcjonalnymi i niefunkcjonalnymi
- Potwierdzenie poprawności działania wszystkich komponentów systemu
- Wykrycie i eliminację potencjalnych błędów przed wdrożeniem produkcyjnym
- Zapewnienie bezpieczeństwa danych użytkowników i dokumentów

## 2. Zakres testów

Testy obejmują następujące obszary systemu:
- Moduł autoryzacji i zarządzania użytkownikami
- Przetwarzanie i ekstrakcja tekstu z dokumentów PDF
- System generowania podsumowań z wykorzystaniem modelu AI
- Interfejs użytkownika i jego responsywność
- Integracja komponentów systemu
- Wydajność i skalowalność
- Bezpieczeństwo danych

## 3. Typy testów

### 3.1. Testy jednostkowe
- Testy poszczególnych funkcji i metod w modułach FastAPI
- Testy walidacji danych wejściowych
- Testy logiki biznesowej

### 3.2. Testy integracyjne
- Testy integracji modułu autoryzacji z bazą danych
- Testy integracji systemu przetwarzania dokumentów z modelem AI
- Testy integracji interfejsu użytkownika z backendem (HTMX + FastAPI)

### 3.3. Testy funkcjonalne
- Testy przepływów użytkownika (rejestracja, logowanie, przesyłanie dokumentów, generowanie podsumowań)
- Testy zgodności z wymaganiami biznesowymi

### 3.4. Testy UI/UX
- Testy interfejsu użytkownika z różnymi rozdzielczościami ekranu
- Testy dostępności i zgodności ze standardami WCAG

### 3.5. Testy wydajnościowe
- Testy obciążeniowe przetwarzania dokumentów
- Testy wydajności modelu AI przy generowaniu podsumowań
- Testy responsywności interfejsu przy dużym obciążeniu

### 3.6. Testy bezpieczeństwa
- Testy uwierzytelniania i autoryzacji
- Testy zabezpieczeń przed atakami typu XSS, CSRF, SQL Injection
- Testy bezpieczeństwa przechowywania danych

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł autoryzacji
1. **Rejestracja użytkownika**
   - Weryfikacja poprawnej rejestracji z poprawnymi danymi
   - Walidacja błędów przy niepoprawnych danych
   - Sprawdzenie unikalności loginu
   - Testowanie mechanizmu haszowania haseł

2. **Logowanie użytkownika**
   - Weryfikacja poprawnego logowania
   - Sprawdzenie obsługi niepoprawnych danych logowania
   - Testowanie generowania i walidacji tokenu JWT
   - Weryfikacja przekierowania po zalogowaniu

3. **Resetowanie hasła**
   - Weryfikacja procesu resetowania hasła
   - Sprawdzenie walidacji tokenów resetowania
   - Testowanie mechanizmu ustawiania nowego hasła

### 4.2. Przetwarzanie dokumentów
1. **Wczytywanie dokumentów PDF**
   - Testowanie obsługi różnych formatów PDF
   - Weryfikacja ekstrakcji tekstu z dokumentów
   - Obsługa dokumentów o różnych rozmiarach i złożoności

2. **Przechowywanie dokumentów**
   - Weryfikacja zapisu metadanych dokumentów w bazie danych
   - Testowanie zarządzania plikami dokumentów

### 4.3. Generowanie podsumowań
1. **Przetwarzanie tekstu przez model AI**
   - Weryfikacja jakości generowanych podsumowań
   - Testowanie obsługi tekstów o różnej długości i złożoności
   - Sprawdzenie czasu przetwarzania

2. **Prezentacja podsumowań**
   - Weryfikacja wyświetlania podsumowań w interfejsie
   - Testowanie mechanizmów feedbacku od użytkowników

## 5. Środowisko testowe

### 5.1. Środowisko deweloperskie
- Lokalne środowisko deweloperskie z zainstalowanymi wszystkimi zależnościami
- Lokalna baza danych PostgreSQL
- Zainstalowane biblioteki PyMuPDF i modele SciBert

### 5.2. Środowisko testowe
- Odizolowane środowisko testowe przypominające produkcję
- Testowa baza danych PostgreSQL
- Konfiguracja zbliżona do produkcyjnej

### 5.3. Środowisko CI/CD
- Zautomatyzowane środowisko testowe w ramach GitHub Actions
- Izolowane kontenery Docker do testów

## 6. Narzędzia do testowania

### 6.1. Testy Python/FastAPI
- Pytest do testów jednostkowych i integracyjnych
- Pytest-asyncio do testowania funkcji asynchronicznych
- FastAPI TestClient do testowania endpointów API

### 6.2. Testy UI
- Selenium lub Playwright do testów interfejsu użytkownika
- Axe dla testów dostępności

### 6.3. Testy wydajnościowe
- Locust do testów obciążeniowych
- Prometheus i Grafana do monitorowania wydajności

### 6.4. Testy bezpieczeństwa
- OWASP ZAP do skanowania podatności
- Bandit do analizy statycznej kodu Python

## 7. Harmonogram testów

### 7.1. Testy ciągłe (CI)
- Automatyczne testy jednostkowe i integracyjne przy każdym pull requeście
- Codzienne testy bezpieczeństwa i wydajnościowe na gałęzi głównej

### 7.2. Testy przed wydaniem
- Kompleksowe testy funkcjonalne przed każdym nowym wydaniem
- Pełne testy wydajnościowe i bezpieczeństwa
- Manualne testy akceptacyjne

## 8. Kryteria akceptacji testów

### 8.1. Kryteria ilościowe
- Pokrycie testami jednostkowymi na poziomie min. 80%
- Wszystkie krytyczne ścieżki użytkownika pokryte testami funkcjonalnymi
- Brak wysokiego i średniego ryzyka w testach bezpieczeństwa

### 8.2. Kryteria jakościowe
- Poprawne działanie wszystkich kluczowych funkcjonalności
- Generowanie poprawnych i wartościowych podsumowań dokumentów
- Responsywność interfejsu użytkownika na różnych urządzeniach
- Czas odpowiedzi systemu zgodny z wymaganiami wydajnościowymi

## 9. Role i odpowiedzialności

### 9.1. Zespół deweloperski
- Implementacja testów jednostkowych
- Naprawa błędów wykrytych podczas testowania
- Utrzymanie infrastruktury CI/CD dla testów

### 9.2. Zespół QA
- Projektowanie i implementacja testów funkcjonalnych
- Przeprowadzanie testów manualnych
- Weryfikacja zgłoszonych błędów

### 9.3. DevOps
- Konfiguracja i utrzymanie środowisk testowych
- Monitorowanie wydajności aplikacji
- Wsparcie przy testach wydajnościowych

## 10. Procedury raportowania błędów

### 10.1. Schemat klasyfikacji błędów
- **Krytyczny**: Uniemożliwia korzystanie z kluczowych funkcjonalności systemu
- **Wysoki**: Znacząco utrudnia korzystanie z systemu
- **Średni**: Powoduje problemy w konkretnych przypadkach użycia
- **Niski**: Drobne niedogodności, które nie wpływają na główne funkcjonalności

### 10.2. Proces zgłaszania błędów
1. Zgłaszanie przez system zarządzania projektami (np. GitHub Issues)
2. Opis zawierający: kroki reprodukcji, oczekiwane i rzeczywiste zachowanie, środowisko testowe
3. Załączanie zrzutów ekranu i logów
4. Przypisanie priorytetu i osoby odpowiedzialnej

### 10.3. Śledzenie i weryfikacja poprawek
1. Monitorowanie statusu zgłoszonych błędów
2. Weryfikacja poprawek przed zamknięciem zgłoszenia
3. Testy regresji po wprowadzeniu poprawek

## 11. Metryki i raportowanie

### 11.1. Kluczowe metryki testowe
- Liczba wykrytych/naprawionych błędów
- Pokrycie kodu testami
- Czas wykonania testów
- Wydajność systemu pod obciążeniem

### 11.2. Raportowanie
- Codzienne aktualizacje statusu testów
- Tygodniowe raporty z postępu testowania
- Szczegółowe raporty po zakończeniu cyklu testowego 