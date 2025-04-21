Frontend:

- HTMX: zapewnia interaktywność interfejsu bez złożoności frameworków JavaScript
- Jinja2: odpowiada za renderowanie szablonów HTML po stronie serwera
- TailwindCSS: ułatwia stylowanie interfejsu użytkownika przez gotowe klasy CSS

Backend:

- FastAPI: szybki framework API Python z obsługą asynchroniczności i automatyczną    dokumentacją
- PostgreSQL: relacyjna baza danych do przechowywania:
    -Kont użytkowników
    -Metadanych dokumentów
    -Podsumowań i feedbacku
- PyMuPDF: wydajna biblioteka do przetwarzania i ekstrakcji tekstu z plików PDF
- SciBert: wyspecjalizowany model AI do podsumowywania tekstów naukowych

Narzędzia do testowania:

- Pytest: framework do testów jednostkowych i integracyjnych
- Pytest-asyncio: rozszerzenie do testowania kodu asynchronicznego
- FastAPI TestClient: do testowania endpoints API
- Selenium/Playwright: do testów End-to-End interfejsu użytkownika
- Axe: do testów dostępności interfejsu
- Locust: do testów wydajnościowych i obciążeniowych
- Prometheus i Grafana: do monitorowania wydajności
- OWASP ZAP: do skanowania podatności bezpieczeństwa
- Bandit: do analizy statycznej kodu Python pod kątem bezpieczeństwa

CI/CD i wdrożenie:

-GitHub Actions: automatyzacja procesów testowania i wdrażania


Ten stos technologiczny oferuje dobrą równowagę między szybkością rozwoju a wydajnością dla MVP. PostgreSQL zapewnia niezawodność przechowywania danych, PyMuPDF efektywną obsługę dokumentów PDF, a model SciBert jest specjalnie dostosowany do przetwarzania tekstów naukowych. Architektura ta umożliwia szybkie tworzenie prototypów przy zachowaniu możliwości skalowania w przyszłości.