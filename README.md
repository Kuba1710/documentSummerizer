# SciSummarize

![Project Status](https://img.shields.io/badge/status-MVP%20Development-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)
- [CI/CD Setup](#ci-cd-setup)

## Project Description

SciSummarize is a web application designed for automatic summarization of scientific and academic texts. The tool uses artificial intelligence (SciBert model) to analyze PDF documents and generate concise summaries that preserve key information from the original text.

### Key Features

- Automatic summarization of academic texts in any language
- Preservation of key elements: methodology, results, conclusions, and statistical data
- Editing and formatting capabilities for generated summaries
- Export of summaries to PDF format
- Simple user account system

### Target Users

SciSummarize is primarily aimed at students, researchers, and scientists who need quick access to the most important information contained in scientific publications without having to read entire documents.

### Problem Solved

Reading entire scientific texts and academic documents is time-consuming. Many users only need the most important information contained in these materials, such as research methodology, key results, main conclusions, statistical data, and citations.

## Tech Stack

### Frontend
- **HTMX**: Provides interface interactivity without JavaScript framework complexity
- **Jinja2**: Handles server-side HTML template rendering
- **TailwindCSS**: Facilitates UI styling through ready-made CSS classes

### Backend
- **FastAPI**: Fast Python API framework with asynchronous support and automatic documentation
- **PostgreSQL**: Relational database for storing:
  - User accounts
  - Document metadata
  - Summaries and feedback
- **PyMuPDF**: Efficient library for processing and extracting text from PDF files
- **SciBert**: Specialized AI model for summarizing scientific texts

### Testing
- **Pytest**: Framework for unit and integration tests
- **Pytest-asyncio**: Extension for testing asynchronous code
- **FastAPI TestClient**: For API endpoint testing
- **Selenium/Playwright**: For end-to-end UI testing
- **Locust**: For load and performance testing 
- **Bandit**: For security testing of Python code

### CI/CD and Deployment
- **GitHub Actions**: Automation of testing and deployment processes

## Getting Started Locally

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12 or higher
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/scisummarize.git
cd scisummarize
```

2. Create and activate virtual environment
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
```bash
# Create .env file with the following variables
DATABASE_URL=postgresql://username:password@localhost:5432/scisummarize
# For async database operations
ASYNC_DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/scisummarize
SECRET_KEY=your_secret_key
# For development only (set to 127.0.0.1 in production)
APP_HOST=127.0.0.1
APP_PORT=8000
DEV_RELOAD=true
```

5. Set up the database
```bash
python scripts/init_db.py
```

6. Run the application
```bash
uvicorn app.main:app --reload
```

7. Access the application
Open your browser and navigate to `http://localhost:8000`

## Available Scripts

- `uvicorn app.main:app --reload` - Run the development server with hot reload
- `pytest` - Run tests
- `pytest --cov=app` - Run tests with coverage report
- `python scripts/init_db.py` - Initialize the database
- `python scripts/clean_documents.py` - Run cleanup task for documents older than 24 hours

## Project Scope

### MVP Includes
- PDF document upload (max 10MB)
- AI-powered text summarization
- Summary editing and formatting
- Export to PDF
- User account system
- Binary feedback system (accept/reject)

### Not Included in MVP
- Import of formats other than PDF (DOCX, TXT, etc.)
- Sharing texts and summaries between users
- Mobile applications (web application only)
- Processing of scanned documents (OCR)
- System learning from user feedback
- Document categorization or tagging
- Summary versioning
- Selection of specific document parts for summarization
- Advanced security features
- Search in stored documents and summaries
- Adding custom notes to summaries

### Technical Limitations
- Simple web application written in Python
- No support for scanned documents (digital text only)
- No advanced security features at the MVP level
- No system learning from user feedback

## Project Status

Currently in MVP development phase. The core functionality is being implemented according to the requirements specified in the PRD.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## CI/CD Setup

This project uses GitHub Actions for continuous integration and deployment. The workflow automatically runs tests and verifies the production build.

### Workflow Details

The pipeline consists of two main jobs:

1. **Test**: Runs security scans, unit tests, integration tests, and E2E tests
   - Uses PostgreSQL service container for database tests
   - Runs Bandit for security scanning
   - Executes Pytest for unit and integration tests
   - Runs Playwright for E2E testing (Chromium only)
   - Uploads test artifacts for debugging

2. **Build**: Creates and verifies the production build
   - Installs dependencies
   - Builds frontend assets
   - Verifies the final build

### Security Scanning

The project uses Bandit for security scanning. Configuration is stored in the `.bandit` file, which specifies:
- Directories/files to exclude from scanning
- Security checks to skip in specific scenarios (like assertions in test files)
- Line-specific exclusions for false positives

Detected security issues are currently treated as warnings rather than errors to allow development to proceed. Before deploying to production, all security issues should be addressed.

### Triggers

The pipeline can be triggered:
- Automatically when pushing to the main/master branch
- Automatically when creating a pull request to main/master
- Manually through the GitHub Actions interface (workflow_dispatch)

### Running Manually

To run the workflow manually:
1. Go to the Actions tab in your GitHub repository
2. Select "CI/CD Pipeline" from the workflows list
3. Click "Run workflow"
4. Select the branch to run on
5. Click "Run workflow"

### Extending the Pipeline

For additional stages like deployment, the workflow can be extended by adding new jobs that depend on the successful completion of the build job.

---

© 2023 SciSummarize Team 