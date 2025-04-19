# API Endpoint Implementation Plan: Generate Summary

## 1. Przegląd punktu końcowego
Endpoint "Generate Summary" umożliwia użytkownikom wygenerowanie podsumowania przesłanego wcześniej dokumentu PDF przy użyciu modelu sztucznej inteligencji SciBert. Endpoint przetwarza dokument, wyodrębnia tekst i tworzy zwięzłe podsumowanie, które zachowuje kluczowe informacje z oryginalnego dokumentu, takie jak metodologia, wyniki i wnioski.

## 2. Szczegóły żądania
- **Metoda HTTP**: POST
- **Struktura URL**: `/documents/{document_id}/summaries`
- **Parametry**:
  - Wymagane: `document_id` (UUID dokumentu w ścieżce)
  - Opcjonalne: brak
- **Nagłówki**:
  - `Authorization`: Bearer {token} (wymagany)
- **Request Body**: brak (endpoint wykorzystuje dokument identyfikowany przez document_id)

## 3. Wykorzystywane typy

### Models (Pydantic)
```python
# models/summary.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class SummaryBase(BaseModel):
    """Base model for summary operations"""
    content: str

class SummaryCreate(SummaryBase):
    """Model for creating a new summary"""
    document_id: UUID

class SummaryInDB(SummaryBase):
    """Model representing a summary in the database"""
    id: UUID
    document_id: UUID
    version: int
    is_current: bool
    created_at: datetime

class SummaryResponse(SummaryInDB):
    """API response model for summary operations"""
    class Config:
        orm_mode = True
```

### Schemas (Database)
```python
# schemas/summary.py
from sqlalchemy import Column, Text, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .base import Base

class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    is_current = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
```

## 4. Szczegóły odpowiedzi
- **Status**: 201 Created (gdy podsumowanie zostało pomyślnie wygenerowane)
- **Content-Type**: application/json
- **Body**:
```json
{
  "id": "UUID",
  "document_id": "UUID",
  "content": "Wygenerowana treść podsumowania...",
  "version": 1,
  "is_current": true,
  "created_at": "2023-08-24T12:34:56.789Z"
}
```

- **Kody statusu**:
  - 201 Created: Pomyślnie utworzono podsumowanie
  - 401 Unauthorized: Brak lub nieprawidłowy token uwierzytelniający
  - 403 Forbidden: Użytkownik nie ma dostępu do dokumentu
  - 404 Not Found: Dokument nie istnieje
  - 422 Unprocessable Entity: Dokument nieprawidłowy lub nie można wyodrębnić tekstu
  - 500 Internal Server Error: Błąd przetwarzania AI lub inny błąd serwera

## 5. Przepływ danych
1. **Walidacja żądania**:
   - Sprawdzenie, czy token JWT jest ważny
   - Walidacja parametru document_id (format UUID)

2. **Pobranie dokumentu**:
   - Zapytanie do bazy danych o dokument o podanym ID
   - Weryfikacja, czy dokument istnieje i należy do uwierzytelnionego użytkownika (dzięki RLS)
   - Sprawdzenie, czy dokument nie wygasł

3. **Przetwarzanie dokumentu**:
   - Otwarcie pliku PDF z podanej ścieżki
   - Wyodrębnienie tekstu przy użyciu PyMuPDF
   - Sprawdzenie, czy tekst może być wyodrębniony

4. **Generowanie podsumowania**:
   - Przetworzenie wyodrębnionego tekstu przez model SciBert
   - Utworzenie podsumowania zawierającego kluczowe elementy (metodologia, wyniki, wnioski, dane statystyczne)

5. **Zapisanie w bazie danych**:
   - Automatyczne oznaczenie poprzednich podsumowań dokumentu jako nieaktualne (dzięki triggerowi)
   - Zapisanie nowego podsumowania z odpowiednim numerem wersji

6. **Odpowiedź**:
   - Zwrócenie szczegółów utworzonego podsumowania
   - Ustawienie odpowiedniego kodu statusu

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**:
  - Weryfikacja tokenu JWT przy każdym żądaniu
  - Wyodrębnienie ID użytkownika z tokenu i ustawienie w zmiennej sesyjnej PostgreSQL

- **Autoryzacja**:
  - Użycie Row Level Security (RLS) w PostgreSQL do filtrowania dostępu do dokumentów
  - Weryfikacja, czy użytkownik ma dostęp do żądanego dokumentu

- **Walidacja danych**:
  - Sprawdzanie poprawności formatu UUID dla document_id
  - Walidacja, czy dokument jest ważnym plikiem PDF

- **Ochrona plików**:
  - Bezpieczne otwieranie plików PDF z kontrolą ścieżek, aby zapobiec atakom typu path traversal
  - Sprawdzenie, czy ścieżka pliku odpowiada oczekiwanemu wzorcowi

- **Ograniczenia zasobów**:
  - Ustawienie limitu czasu na przetwarzanie dokumentu w celu ochrony przed atakami DoS
  - Implementacja kolejki zadań dla długotrwałych operacji przetwarzania

## 7. Obsługa błędów
- **401 Unauthorized**:
  - Przyczyna: Brak tokenu JWT lub nieprawidłowy token
  - Rozwiązanie: Zwrócenie odpowiedniego komunikatu o błędzie uwierzytelniania

- **403 Forbidden**:
  - Przyczyna: Dokument nie należy do uwierzytelnionego użytkownika
  - Rozwiązanie: Zwrócenie komunikatu o braku dostępu bez ujawniania, czy dokument istnieje

- **404 Not Found**:
  - Przyczyna: Dokument o podanym ID nie istnieje
  - Rozwiązanie: Zwrócenie komunikatu o nieznalezieniu dokumentu

- **422 Unprocessable Entity**:
  - Przyczyna: Nieprawidłowy format dokumentu lub niemożność wyodrębnienia tekstu
  - Rozwiązanie: Szczegółowy komunikat o problemie z dokumentem

- **500 Internal Server Error**:
  - Przyczyna: Błąd modelu AI, problemy z bazą danych lub inne błędy serwera
  - Rozwiązanie: Zalogowanie błędu, zwrócenie ogólnego komunikatu o błędzie

## 8. Rozważania dotyczące wydajności
- **Asynchroniczne przetwarzanie**:
  - Wykorzystanie async/await w FastAPI do obsługi równoległych żądań
  - Użycie mechanizmu kolejki zadań (np. Celery) dla długotrwałych operacji przetwarzania

- **Przetwarzanie tekstu**:
  - Optymalizacja wyodrębniania tekstu z PDF poprzez przetwarzanie stronami
  - Implementacja limitu rozmiaru dla dużych dokumentów

- **Dzielenie podsumowania**:
  - Dla bardzo długich dokumentów, podzielenie tekstu na części przed wysłaniem do modelu AI

- **Caching**:
  - Przechowywanie wyodrębnionych tekstów w pamięci podręcznej dla powtórnych żądań podsumowania
  - Zastosowanie cache'u dla często używanych połączeń z bazą danych

## 9. Etapy wdrożenia

1. **Przygotowanie modeli danych**:
   ```python
   # 1. Utwórz modele Pydantic do walidacji danych
   # 2. Upewnij się, że modele odpowiadają strukturze bazy danych
   ```

2. **Utworzenie serwisu SummaryService**:
   ```python
   # services/summary_service.py
   from uuid import UUID
   import fitz  # PyMuPDF
   from models.summary import SummaryCreate, SummaryInDB
   from db.database import get_db

   class SummaryService:
       def __init__(self, db_session):
           self.db = db_session
           self.scibert_model = load_scibert_model()  # Załadowanie modelu AI
       
       async def get_document(self, document_id: UUID):
           """Pobierz dokument i zweryfikuj dostęp"""
           # Zapytanie do bazy danych (RLS zapewni dostęp tylko do dokumentów użytkownika)
           # Zgłoś 404, jeśli dokument nie istnieje
           
       async def extract_text(self, file_path: str):
           """Wyodrębnij tekst z dokumentu PDF"""
           # Użyj PyMuPDF do bezpiecznego otwarcia pliku i wyodrębnienia tekstu
           # Obsłuż błędy i zgłoś 422, jeśli nie można przetworzyć dokumentu
           
       async def generate_summary(self, text: str):
           """Wygeneruj podsumowanie tekstu przy użyciu SciBert"""
           # Użyj modelu SciBert do przetworzenia tekstu i wygenerowania podsumowania
           # Zwróć wygenerowane podsumowanie
           
       async def create_summary(self, document_id: UUID):
           """Proces end-to-end tworzenia podsumowania"""
           # 1. Pobierz dokument
           # 2. Wyodrębnij tekst
           # 3. Wygeneruj podsumowanie
           # 4. Zapisz w bazie danych
           # 5. Zwróć utworzone podsumowanie
   ```

3. **Implementacja endpointu FastAPI**:
   ```python
   # routers/summary_router.py
   from fastapi import APIRouter, Depends, HTTPException, status
   from sqlalchemy.orm import Session
   from typing import Any
   from uuid import UUID

   from models.summary import SummaryResponse
   from services.summary_service import SummaryService
   from db.database import get_db
   from auth.jwt import get_current_user

   router = APIRouter(prefix="/documents", tags=["summaries"])

   @router.post("/{document_id}/summaries", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
   async def generate_summary(
       document_id: UUID,
       db: Session = Depends(get_db),
       current_user: dict = Depends(get_current_user)
   ) -> Any:
       """Generuje nowe podsumowanie dla dokumentu"""
       summary_service = SummaryService(db)
       try:
           # Stwórz nowe podsumowanie
           summary = await summary_service.create_summary(document_id)
           return summary
       except HTTPException as ex:
           # Przekaż HTTPException dalej (404, 403, itd.)
           raise
       except Exception as e:
           # Zaloguj błąd
           logger.error(f"Error generating summary: {str(e)}")
           raise HTTPException(
               status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
               detail="An error occurred while generating the summary"
           )
   ```

4. **Konfiguracja zależności**:
   ```python
   # Konfiguracja zależności dla endpointu
   # Podłączenie do głównej aplikacji FastAPI
   ```

5. **Implementacja testów jednostkowych**:
   ```python
   # tests/test_summary_endpoint.py
   # Testy dla endpointu generowania podsumowania
   # Testy dla różnych przypadków: sukces, brak dokumentu, dokument innego użytkownika, itd.
   ```

6. **Dokumentacja API**:
   ```python
   # Dodaj szczegółowe opisy do schematów i endpointów FastAPI
   # dla automatycznej dokumentacji OpenAPI
   ```

7. **Integracja z interfejsem użytkownika**:
   ```html
   <!-- Dodaj odpowiednie elementy HTMX do interfejsu użytkownika -->
   <button hx-post="/documents/{document_id}/summaries"
           hx-headers='{"Authorization": "Bearer ${token}"}'
           hx-target="#summary-container"
           hx-indicator="#spinner">
       Generuj podsumowanie
   </button>
   <div id="spinner" class="htmx-indicator">
       Generowanie podsumowania...
   </div>
   <div id="summary-container"></div>
   ```
