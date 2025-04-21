# Specyfikacja architektury modułu autentykacji - SciSummarize

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura stron i komponentów

#### Nowe strony i widoki:
- **Strona logowania** (`/login`) - dostępna dla niezalogowanych użytkowników
- **Strona rejestracji** (`/register`) - dostępna dla niezalogowanych użytkowników
- **Strona odzyskiwania hasła** (`/reset-password`) - dostępna dla niezalogowanych użytkowników
- **Strona ustawienia nowego hasła** (`/set-new-password`) - dostępna po kliknięciu w link z emaila resetującego hasło

#### Rozszerzenie istniejących komponentów:
- **Nagłówek (Header)** - rozszerzenie o:
  - Wyświetlanie nazwy użytkownika dla zalogowanych
  - Przycisk wylogowania dla zalogowanych
  - Przyciski logowania/rejestracji dla niezalogowanych

#### Komponenty do zaimplementowania:
- **LoginForm** - formularz logowania
- **RegisterForm** - formularz rejestracji
- **ResetPasswordForm** - formularz odzyskiwania hasła
- **SetNewPasswordForm** - formularz ustawienia nowego hasła
- **AuthHeader** - wariant nagłówka dla zalogowanego użytkownika
- **NonAuthHeader** - wariant nagłówka dla niezalogowanego użytkownika
- **AuthGuard** - komponent zabezpieczający strony wymagające logowania

### 1.2. Formularze i walidacja

#### LoginForm:
- Pola:
  - Login (walidacja: niepuste pole)
  - Hasło (walidacja: niepuste pole)
- Akcje:
  - Przycisk "Zaloguj" - wywołuje endpoint `/api/auth/login`
  - Link "Zapomniałem hasła" - przekierowuje do `/reset-password`
  - Link "Zarejestruj się" - przekierowuje do `/register`
- Obsługa błędów:
  - Niepoprawne dane logowania
  - Problem z połączeniem
  - Konto nieaktywne

#### RegisterForm:
- Pola:
  - Login (walidacja: unikalność, min. 4 znaki, tylko litery, cyfry i podkreślniki)
  - Hasło (walidacja: min. 8 znaków, co najmniej 1 duża litera, 1 cyfra)
  - Powtórz hasło (walidacja: identyczne z hasłem)
- Akcje:
  - Przycisk "Zarejestruj" - wywołuje endpoint `/api/auth/register`
  - Link "Masz już konto? Zaloguj się" - przekierowuje do `/login`
- Obsługa błędów:
  - Login już zajęty
  - Hasło nie spełnia wymagań bezpieczeństwa
  - Hasła nie są identyczne
  - Problem z połączeniem

#### ResetPasswordForm:
- Pola:
  - Login (walidacja: niepuste pole)
- Akcje:
  - Przycisk "Resetuj hasło" - wywołuje endpoint `/api/auth/reset-password`
- Obsługa błędów:
  - Użytkownik nie istnieje
  - Problem z wysłaniem emaila
  - Problem z połączeniem

#### SetNewPasswordForm:
- Pola:
  - Nowe hasło (walidacja: min. 8 znaków, co najmniej 1 duża litera, 1 cyfra)
  - Powtórz hasło (walidacja: identyczne z hasłem)
- Akcje:
  - Przycisk "Ustaw nowe hasło" - wywołuje endpoint `/api/auth/set-new-password`
- Obsługa błędów:
  - Token resetowania wygasł lub jest nieprawidłowy
  - Hasło nie spełnia wymagań bezpieczeństwa
  - Hasła nie są identyczne
  - Problem z połączeniem

### 1.3. Przepływy użytkownika (User Flow)

#### Rejestracja:
1. Użytkownik wchodzi na stronę `/register`
2. Wypełnia formularz RegisterForm
3. Po pomyślnej rejestracji zostaje przekierowany na stronę logowania z komunikatem sukcesu
4. W przypadku błędu formularz wyświetla odpowiedni komunikat

#### Logowanie:
1. Użytkownik wchodzi na stronę `/login`
2. Wypełnia formularz LoginForm
3. Po pomyślnym logowaniu zostaje przekierowany na stronę główną aplikacji
4. W przypadku błędu formularz wyświetla odpowiedni komunikat

#### Wylogowanie:
1. Zalogowany użytkownik klika przycisk "Wyloguj" w nagłówku
2. System wywołuje endpoint `/api/auth/logout`
3. Użytkownik zostaje przekierowany na stronę logowania z komunikatem o pomyślnym wylogowaniu

#### Resetowanie hasła:
1. Użytkownik wchodzi na stronę `/reset-password`
2. Wypełnia formularz ResetPasswordForm
3. System wysyła email z linkiem do resetowania hasła
4. Użytkownik klika w link w emailu, który prowadzi do `/set-new-password?token=xxx`
5. Wypełnia formularz SetNewPasswordForm
6. Po pomyślnym ustawieniu nowego hasła zostaje przekierowany na stronę logowania z komunikatem sukcesu

### 1.4. Zarządzanie stanem autentykacji

- Wykorzystanie ciasteczek HTTP (httpOnly) do przechowywania tokenu sesji
- Wykorzystanie zmiennej Jinja2 do przekazywania stanu autentykacji do szablonów (`is_authenticated`)
- Przekierowanie niezalogowanych użytkowników z chronionych stron na stronę logowania
- Przekierowanie zalogowanych użytkowników ze stron logowania/rejestracji na stronę główną

## 2. LOGIKA BACKENDOWA

### 2.1. Struktura endpointów API

#### Endpointy autentykacji:
- `POST /api/auth/register` - rejestracja nowego użytkownika
  - Dane wejściowe: `{ login, password }`
  - Odpowiedź: `{ success: true/false, message: string }`
  
- `POST /api/auth/login` - logowanie użytkownika
  - Dane wejściowe: `{ login, password }`
  - Odpowiedź: `{ success: true/false, user: { login }, message: string }`
  
- `POST /api/auth/logout` - wylogowanie użytkownika
  - Dane wejściowe: brak (wykorzystuje token sesji z ciasteczka)
  - Odpowiedź: `{ success: true/false, message: string }`
  
- `POST /api/auth/reset-password` - inicjacja procesu resetowania hasła
  - Dane wejściowe: `{ login }`
  - Odpowiedź: `{ success: true/false, message: string }`
  
- `POST /api/auth/set-new-password` - ustawienie nowego hasła
  - Dane wejściowe: `{ token, password }`
  - Odpowiedź: `{ success: true/false, message: string }`

#### Endpoint profilu użytkownika:
- `GET /api/user/profile` - pobranie informacji o zalogowanym użytkowniku
  - Dane wejściowe: brak (wykorzystuje token sesji z ciasteczka)
  - Odpowiedź: `{ login, createdAt }`

### 2.2. Modele danych

#### Model Document w Supabase:
```sql
-- Tabela documents w Supabase
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Foreign key constraint
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indeksy
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_expires_at ON documents(expires_at);
```

### 2.3. Walidacja danych wejściowych

#### Walidatory rejestracji:
```python
class RegisterValidator(BaseModel):
    login: str = Field(..., min_length=4, regex=r'^[a-zA-Z0-9_]+$')
    password: str = Field(..., min_length=8, regex=r'^(?=.*[A-Z])(?=.*\d).+$')
```

#### Walidatory logowania:
```python
class LoginValidator(BaseModel):
    login: str
    password: str
```

#### Walidatory resetowania hasła:
```python
class ResetPasswordValidator(BaseModel):
    login: str
    
class SetNewPasswordValidator(BaseModel):
    token: str
    password: str = Field(..., min_length=8, regex=r'^(?=.*[A-Z])(?=.*\d).+$')
```

### 2.4. Obsługa wyjątków

- Utworzenie niestandardowych wyjątków:
  - `AuthenticationError` - błąd logowania (niepoprawne dane)
  - `RegistrationError` - błąd rejestracji (login zajęty, itp.)
  - `ResetPasswordError` - błąd resetowania hasła (niepoprawny token, itp.)
  
- Globalna obsługa wyjątków dla endpointów autentykacji:
  - Przekształcenie wyjątków na odpowiedzi HTTP z odpowiednimi kodami statusu i komunikatami
  - Logowanie błędów dla celów diagnostycznych
  - Ukrywanie szczegółów technicznych przed użytkownikiem końcowym

## 3. SYSTEM AUTENTYKACJI (INTEGRACJA Z SUPABASE AUTH)

### 3.1. Inicjalizacja Supabase w aplikacji

```python
from supabase import create_client, Client
from fastapi import FastAPI

app = FastAPI()

# Inicjalizacja klienta Supabase
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Dodanie klienta Supabase do kontekstu aplikacji
app.state.supabase = supabase
```

### 3.2. Serwisy autentykacji

#### AuthService - klasa odpowiedzialna za operacje autentykacji:

```python
class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def register(self, login: str, password: str):
        try:
            # Rejestracja użytkownika poprzez Supabase Auth
            response = self.supabase.auth.sign_up({
                "email": f"{login}@example.com",  # Tymczasowe rozwiązanie - w przyszłości można dodać email
                "password": password,
                "options": {
                    "data": {
                        "login": login
                    }
                }
            })
            
            # Sprawdzenie odpowiedzi
            if response.user and response.user.id:
                return {"success": True, "user_id": response.user.id}
            else:
                raise RegistrationError("Nie udało się zarejestrować użytkownika")
                
        except Exception as e:
            # Obsługa błędów specyficznych dla Supabase
            if "User already registered" in str(e):
                raise RegistrationError("Login już zajęty")
            else:
                raise RegistrationError(f"Błąd rejestracji: {str(e)}")
        
    async def login(self, login: str, password: str):
        try:
            # Logowanie użytkownika poprzez Supabase Auth
            response = self.supabase.auth.sign_in_with_password({
                "email": f"{login}@example.com",  # Tymczasowe rozwiązanie - w przyszłości można dodać email
                "password": password
            })
            
            # Pobieranie tokenu sesji i danych użytkownika
            session = response.session
            user = response.user
            
            if session and user:
                return {
                    "success": True, 
                    "user": {
                        "id": user.id,
                        "login": user.user_metadata.get("login", login)
                    },
                    "session": {
                        "access_token": session.access_token,
                        "refresh_token": session.refresh_token,
                        "expires_at": session.expires_at
                    }
                }
            else:
                raise AuthenticationError("Niepoprawne dane logowania")
                
        except Exception as e:
            # Obsługa błędów specyficznych dla Supabase
            if "Invalid login credentials" in str(e):
                raise AuthenticationError("Niepoprawny login lub hasło")
            else:
                raise AuthenticationError(f"Błąd logowania: {str(e)}")
        
    async def logout(self, session_token: str):
        try:
            # Wylogowanie użytkownika
            self.supabase.auth.sign_out()
            return {"success": True}
        except Exception as e:
            raise AuthenticationError(f"Błąd wylogowania: {str(e)}")
        
    async def reset_password(self, login: str):
        try:
            # Inicjowanie resetowania hasła
            self.supabase.auth.reset_password_email(f"{login}@example.com")
            return {"success": True}
        except Exception as e:
            raise ResetPasswordError(f"Błąd resetowania hasła: {str(e)}")
        
    async def set_new_password(self, token: str, password: str):
        try:
            # Ustawienie nowego hasła
            self.supabase.auth.update_user({
                "password": password
            }, token)
            return {"success": True}
        except Exception as e:
            raise ResetPasswordError(f"Błąd ustawiania nowego hasła: {str(e)}")
        
    async def validate_session(self, session_token: str):
        try:
            # Walidacja tokenu sesji
            self.supabase.auth.set_session(session_token)
            user = self.supabase.auth.get_user()
            
            if user and user.user:
                return {
                    "id": user.user.id,
                    "login": user.user.user_metadata.get("login")
                }
            return None
        except Exception:
            return None
```

### 3.3. Middleware autentykacji

```python
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Pobranie tokenu sesji z ciasteczka
    session_token = request.cookies.get("session_token")
    
    # Domyślnie użytkownik jest niezalogowany
    request.state.authenticated = False
    request.state.user = None
    
    # Jeśli token istnieje, sprawdź jego ważność
    if session_token:
        auth_service = AuthService(request.app.state.supabase)
        try:
            user = await auth_service.validate_session(session_token)
            if user:
                request.state.authenticated = True
                request.state.user = user
        except Exception as e:
            # Token jest nieprawidłowy lub wygasł - nic nie rób
            pass
    
    # Kontynuuj obsługę żądania
    response = await call_next(request)
    return response
```

### 3.4. Zależności FastAPI dla ochrony endpointów

```python
async def require_auth(request: Request):
    if not request.state.authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return request.state.user

# Przykład użycia w endpointach:
@app.get("/api/user/profile", dependencies=[Depends(require_auth)])
async def get_user_profile(request: Request):
    return request.state.user
```

### 3.5. Integracja z HTMX dla formularzy

Przykład integracji formularza logowania z HTMX:

```html
<form id="login-form" hx-post="/api/auth/login" hx-swap="outerHTML" hx-trigger="submit">
  <div class="form-group">
    <label for="login">Login:</label>
    <input type="text" id="login" name="login" required>
  </div>
  <div class="form-group">
    <label for="password">Hasło:</label>
    <input type="password" id="password" name="password" required>
  </div>
  <div class="form-error" id="login-error"></div>
  <button type="submit">Zaloguj</button>
</form>
```

Odpowiedź z endpointu w przypadku powodzenia:

```html
<div id="login-form" hx-swap-oob="true" hx-redirect="/">
  <!-- Zawartość zostanie podmieniona przez przekierowanie -->
</div>
```

Odpowiedź z endpointu w przypadku błędu:

```html
<form id="login-form" hx-post="/api/auth/login" hx-swap="outerHTML" hx-trigger="submit">
  <div class="form-group">
    <label for="login">Login:</label>
    <input type="text" id="login" name="login" value="{{ login }}" required>
  </div>
  <div class="form-group">
    <label for="password">Hasło:</label>
    <input type="password" id="password" name="password" required>
  </div>
  <div class="form-error" id="login-error">
    {{ error_message }}
  </div>
  <button type="submit">Zaloguj</button>
</form>
```

### 3.6. Obsługa automatycznego usuwania dokumentów

```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from datetime import datetime

# Konfiguracja Background Schedulera
jobstores = {
    'default': SQLAlchemyJobStore(url=os.environ.get("DATABASE_URL"))
}
scheduler = BackgroundScheduler(jobstores=jobstores)

# Zadanie do usuwania przeterminowanych dokumentów
def cleanup_expired_documents():
    try:
        # Pobieranie przeterminowanych dokumentów z Supabase
        now = datetime.utcnow().isoformat()
        expired_docs = app.state.supabase.table('documents').select('id').lt('expires_at', now).execute()
        
        if expired_docs and expired_docs.data:
            for doc in expired_docs.data:
                # Usuwanie fizycznych plików
                try:
                    os.remove(os.path.join(UPLOAD_DIR, str(doc['id'])))
                except:
                    pass
                
                # Usuwanie rekordu z Supabase
                app.state.supabase.table('documents').delete().eq('id', doc['id']).execute()
                
        print(f"Proces czyszczenia dokumentów zakończony. Usunięto {len(expired_docs.data) if expired_docs and expired_docs.data else 0} dokumentów.")
    except Exception as e:
        print(f"Błąd podczas czyszczenia dokumentów: {str(e)}")

# Uruchomienie schedulera przy starcie aplikacji
@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(
        cleanup_expired_documents, 
        'interval', 
        hours=1,
        id='cleanup_documents'
    )
    scheduler.start()

# Zatrzymanie schedulera przy zamknięciu aplikacji
@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()
```

## 4. WNIOSKI

- Architektura modułu autentykacji została zaprojektowana zgodnie z tech-stackiem aplikacji (FastAPI, HTMX, Jinja2, TailwindCSS) i zintegrowana z Supabase Auth, co zapewnia bezpieczne i gotowe rozwiązanie dla funkcjonalności autentykacji.
  
- Obsługa autentykacji jest realizowana przez dedykowane endpointy API i formularze HTML, komunikujące się za pomocą HTMX, co zapewnia dynamiczną interakcję bez konieczności pisania złożonego kodu JavaScript.
  
- Bezpieczeństwo zapewnione przez:
  - Bezpieczne przechowywanie haseł (Supabase Auth)
  - Tokeny sesji w ciasteczkach HTTP (httpOnly)
  - Walidację danych wejściowych
  - Middleware autentykacji
  
- Integracja z istniejącą aplikacją polega na:
  - Dodaniu komponentów autentykacji do szablonów
  - Zabezpieczeniu istniejących endpointów przez zależności wymagające autentykacji
  - Przekazywaniu stanu autentykacji do szablonów
  
- Zgodnie z wymaganiem z PRD, dokumenty użytkowników są automatycznie usuwane po 24 godzinach od momentu ich dodania, co jest implementowane przez zaplanowane zadanie działające w tle.

- Implementacja spełnia wszystkie wymagania użytkownika zawarte w historiach US-001, US-002 i US-003 z dokumentu PRD, a także zapewnia podstawy do realizacji pozostałych historii użytkownika związanych z zarządzaniem dokumentami. 