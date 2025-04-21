import pytest
pytestmark = pytest.mark.asyncio
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import status, HTTPException
from datetime import datetime

from main import app
from db.database import get_db
from auth.jwt import get_current_user, get_current_user_from_cookie


# Sprawdzamy, czy aplikacja działa
def test_app_exists():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code in [200, 307, 404]  # Możemy przekierować, zwrócić stronę główną lub 404 jeśli nie zdefiniowano routa

# Tworzymy mocka dla zależności bazy danych
async def override_get_db():
    mock_db = AsyncMock()
    try:
        yield mock_db
    finally:
        pass

# Tworzymy mocka dla zależności uwierzytelniania
async def override_get_current_user():
    return {
        "id": "00000000-0000-0000-0000-000000000000",
        "username": "testuser",
        "created_at": "2023-08-24T12:34:56.789Z"
    }

# Tworzymy mocka dla uwierzytelniania przez ciasteczko
async def override_get_current_user_from_cookie(request):
    return {
        "id": "00000000-0000-0000-0000-000000000000",
        "username": "testuser",
        "created_at": "2023-08-24T12:34:56.789Z"
    }

# Zastępujemy zależności dla testów
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[get_current_user_from_cookie] = override_get_current_user_from_cookie

# Klient testowy
client = TestClient(app)


# Poniżej są testy, które będą aktualne po implementacji endpointu
#@pytest.mark.skip(reason="API endpoint /api/documents/{id}/summaries not fully implemented yet")
class TestSummaryEndpoint:
    """Tests for the summary generation endpoint"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Fixture to provide a mock db session"""
        return AsyncMock()
    
    @pytest.fixture
    def valid_document_id(self):
        """Fixture for a valid document UUID"""
        return uuid4()

    @pytest.fixture
    def mock_document(self, valid_document_id):
        """Fixture for a mock document object"""
        doc = MagicMock()
        doc.id = valid_document_id
        doc.user_id = UUID("00000000-0000-0000-0000-000000000000")
        doc.file_path = "/path/to/document.pdf"
        doc.title = "Test Document"
        doc.expiration_timestamp = "2099-01-01T00:00:00"
        return doc
    
    @pytest.fixture
    def mock_summary(self, valid_document_id):
        """Fixture for a mock summary object"""
        summary = MagicMock()
        summary.id = uuid4()
        summary.document_id = valid_document_id
        summary.content = "This is a test summary."
        summary.version = 1
        summary.is_current = True
        summary.created_at = "2023-08-24T12:34:56.789Z"
        return summary

    #@patch("services.summary_service.SummaryService.create_summary")
    #async def test_generate_summary_success(self, mock_create_summary, mock_summary, valid_document_id):
    #    """Test successful summary generation"""
    #    # Ustaw wartość zwracaną przez mocka
    #    mock_create_summary.return_value = {
    #        "id": str(mock_summary.id),
    #        "document_id": str(valid_document_id),
    #        "content": "This is a test summary.",
    #        "version": 1,
    #        "is_current": True,
    #        "created_at": "2023-08-24T12:34:56.789Z"
    #    }
    #    
    #    # Wywołaj endpoint z prawidłowym prefiksem API
    #    # Dodajemy ciasteczko sesji
    #    client.cookies.set("session_token", "test_token")
    #    response = client.post(f"/api/documents/{valid_document_id}/summaries")
    #    
    #    # Sprawdź, czy wywołanie było udane
    #    assert response.status_code == status.HTTP_201_CREATED
    #    assert "id" in response.json()
    #    assert "content" in response.json()
    #    assert response.json()["document_id"] == str(valid_document_id)
    #    assert response.json()["content"] == "This is a test summary."
    #    
    #    # Sprawdź, czy metoda create_summary została wywołana z odpowiednimi parametrami
    #    mock_create_summary.assert_called_once_with(valid_document_id)

    #@patch("services.summary_service.SummaryService.create_summary")
    #async def test_document_not_found(self, mock_create_summary, valid_document_id):
    #    """Test summary generation with non-existent document"""
    #    # Ustaw, że metoda rzuca odpowiedni wyjątek
    #    mock_create_summary.side_effect = HTTPException(
    #        status_code=status.HTTP_404_NOT_FOUND, 
    #        detail="Document not found"
    #    )
    #    
    #    # Wywołaj endpoint z prawidłowym prefiksem API
    #    client.cookies.set("session_token", "test_token")
    #    response = client.post(f"/api/documents/{valid_document_id}/summaries")
    #    
    #    # Sprawdź odpowiedź
    #    assert response.status_code == status.HTTP_404_NOT_FOUND
    #    assert response.json()["detail"] == "Document not found"

    #@patch("services.summary_service.SummaryService.create_summary")
    #async def test_invalid_document_format(self, mock_create_summary, valid_document_id):
    #    """Test summary generation with invalid document format"""
    #    # Ustaw, że metoda rzuca odpowiedni wyjątek
    #    mock_create_summary.side_effect = HTTPException(
    #        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
    #        detail="The file is not a valid PDF document"
    #    )
    #    
    #    # Wywołaj endpoint z prawidłowym prefiksem API
    #    client.cookies.set("session_token", "test_token")
    #    response = client.post(f"/api/documents/{valid_document_id}/summaries")
    #    
    #    # Sprawdź odpowiedź
    #    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    #    assert response.json()["detail"] == "The file is not a valid PDF document"

    #@patch("services.summary_service.SummaryService.create_summary")
    #async def test_processing_error(self, mock_create_summary, valid_document_id):
    #    """Test summary generation with processing error"""
    #    # Ustaw, że metoda rzuca ogólny wyjątek
    #    mock_create_summary.side_effect = Exception("Some internal error")
    #    
    #    # Wywołaj endpoint z prawidłowym prefiksem API
    #    client.cookies.set("session_token", "test_token")
    #    response = client.post(f"/api/documents/{valid_document_id}/summaries")
    #    
    #    # Sprawdź odpowiedź
    #    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        
    def test_invalid_document_id_format(self):
        """Test summary generation with invalid UUID format"""
        # Wywołaj endpoint z nieprawidłowym UUID i prawidłowym prefiksem API
        client.cookies.set("session_token", "test_token")
        response = client.post("/api/documents/not-a-uuid/summaries")
        
        # Sprawdź odpowiedź - FastAPI powinno automatycznie zwrócić 422 dla nieprawidłowego UUID
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
    def test_unauthorized_access(self):
        """Test unauthorized access without session token"""
        # Wywołaj endpoint bez ciasteczka sesji
        valid_document_id = uuid4()
        response = client.post(f"/api/documents/{valid_document_id}/summaries")
        
        # Sprawdź odpowiedź - brak autoryzacji
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN] 