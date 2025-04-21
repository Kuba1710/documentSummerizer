from uuid import UUID
import fitz  # PyMuPDF
import os
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from pathlib import Path
from datetime import datetime
import uuid
import json

from models.summary import SummaryCreate, SummaryInDB
from schemas.summary import Summary
from schemas.documents import Document  # Zakładam, że istnieje schemat dokumentu

# Konfiguracja loggera
logger = logging.getLogger(__name__)


class SummaryService:
    """Service for managing document summaries"""
    
    def __init__(self, db_session: Session = None):
        """Initialize the service with database session
        
        Args:
            db_session: SQLAlchemy database session, can be None for file-based operations
        """
        self.db = db_session
        # W rzeczywistej implementacji załadowalibyśmy model SciBert tutaj
        # self.scibert_model = self._load_scibert_model()
    
    def _load_scibert_model(self):
        """Load the SciBert model for text summarization
        
        This is a placeholder - in a real implementation, this would load 
        the actual AI model with proper error handling
        """
        # Tutaj w rzeczywistej implementacji ładowalibyśmy model NLP
        logger.info("Loading SciBert model")
        # Przykład:
        # from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        # tokenizer = AutoTokenizer.from_pretrained("allenai/scibert_scivocab_uncased")
        # model = AutoModelForSeq2SeqLM.from_pretrained("allenai/scibert_scivocab_uncased")
        # return {"model": model, "tokenizer": tokenizer}
        
        # Tymczasowo zwracamy mock
        return {"model": "scibert_mock", "tokenizer": "scibert_tokenizer_mock"}
    
    async def get_document(self, document_id: UUID):
        """Fetch document from database and verify access
        
        Args:
            document_id: UUID of the document to retrieve
            
        Returns:
            Document object if found
            
        Raises:
            HTTPException: 404 if document not found or 403 if access denied
        """
        # Dzięki RLS, baza danych już filtruje dostęp tylko do dokumentów użytkownika
        stmt = select(Document).where(Document.id == document_id)
        result = await self.db.execute(stmt)
        document = result.scalar_one_or_none()
        
        if not document:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
            
        # Sprawdź czy dokument nie wygasł
        if document.expiration_timestamp < datetime.now():
            logger.warning(f"Document expired: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Document has expired"
            )
            
        return document
    
    async def extract_text(self, file_path: str):
        """Extract text from PDF document
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text as string
            
        Raises:
            HTTPException: 422 if document can't be processed
        """
        try:
            # Bezpieczne otwarcie pliku z obsługą path traversal
            safe_path = Path(file_path)
            # TODO: W rzeczywistej implementacji należy dodać dodatkowe 
            # walidacje ścieżki aby zapobiec path traversal
            
            if not os.path.exists(safe_path):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Document file not found on server"
                )
                
            # Otwórz dokument PDF przy użyciu PyMuPDF
            pdf_document = fitz.open(safe_path)
            
            # Wyodrębnij tekst ze wszystkich stron
            text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                text += page.get_text()
                
            # Zamknij dokument PDF
            pdf_document.close()
            
            if not text.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No text could be extracted from the document"
                )
                
            return text
            
        except fitz.FileDataError:
            logger.error(f"Invalid PDF file: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The file is not a valid PDF document"
            )
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while processing the document"
            )
    
    async def generate_summary(self, text: str):
        """Generate summary from text using SciBert model
        
        Args:
            text: Input text to summarize
            
        Returns:
            Generated summary text
        """
        try:
            # W rzeczywistej implementacji, używalibyśmy modelu SciBert
            # do generowania podsumowania. Tutaj symulujemy to przez 
            # zwrócenie pierwszych 500 znaków jako podsumowanie.
            
            logger.info("Generating summary using SciBert model")
            
            # Symulacja przetwarzania - w rzeczywistej implementacji
            # użylibyśmy modelu AI
            # Przykład:
            # inputs = self.scibert_model["tokenizer"](text, max_length=1024, truncation=True, return_tensors="pt")
            # summary_ids = self.scibert_model["model"].generate(inputs["input_ids"], max_length=150)
            # summary = self.scibert_model["tokenizer"].decode(summary_ids[0], skip_special_tokens=True)
            
            # Tymczasowe podsumowanie jako przykład
            words = text.split()
            if len(words) > 100:
                summary = " ".join(words[:100]) + "..."
            else:
                summary = text
                
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while generating the summary"
            )
    
    async def create_summary(self, document_id: UUID):
        """End-to-end process of creating a summary
        
        Args:
            document_id: UUID of the document to summarize
            
        Returns:
            Created summary object
            
        Raises:
            HTTPException: Various error codes based on the specific error
        """
        try:
            # Define file path directly (since we're not using database records yet)
            file_path = Path("uploads") / f"{document_id}.pdf"
            
            if not file_path.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Document file not found: {document_id}"
                )
            
            # 1. Extract text from the PDF
            text = await self.extract_text(str(file_path))
            
            # 2. Generate summary
            summary_content = await self.generate_summary(text)
            
            # 3. Create summary object
            summary = {
                "id": uuid.uuid4(),
                "document_id": document_id,
                "content": summary_content,
                "version": 1,
                "is_current": True,
                "created_at": datetime.now()
            }
            
            # 4. In production, we would save to database
            # For now, we'll save to a JSON file to maintain state
            summaries_dir = Path("summaries")
            summaries_dir.mkdir(exist_ok=True)
            
            summary_file = summaries_dir / f"{document_id}.json"
            with open(summary_file, "w") as f:
                # Convert UUID to string for JSON serialization
                json_summary = {
                    "id": str(summary["id"]),
                    "document_id": str(summary["document_id"]),
                    "content": summary["content"],
                    "version": summary["version"],
                    "is_current": summary["is_current"],
                    "created_at": summary["created_at"].isoformat()
                }
                json.dump(json_summary, f, indent=2)
            
            logger.info(f"Summary created for document: {document_id}")
            return summary
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        
        except Exception as e:
            logger.error(f"Error creating summary: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while creating the summary: {str(e)}"
            ) 