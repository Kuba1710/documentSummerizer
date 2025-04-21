import os
from supabase import create_client, Client
from fastapi import HTTPException
from auth.exceptions import AuthenticationError, RegistrationError, ResetPasswordError

class AuthService:
    def __init__(self):
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("Brak konfiguracji SUPABASE_URL lub SUPABASE_KEY w zmiennych środowiskowych")
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    async def register(self, login: str, password: str):
        try:
            # Rejestracja użytkownika poprzez Supabase Auth
            response = self.supabase.auth.sign_up({
                "email": f"{login}@example.com",  # Tymczasowe rozwiązanie
                "password": password,
                "options": {
                    "data": {
                        "login": login
                    }
                }
            })
            
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
                "email": f"{login}@example.com",
                "password": password
            })
            
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
        
    async def logout(self):
        try:
            # Wylogowanie użytkownika
            self.supabase.auth.sign_out()
            return {"success": True}
        except Exception as e:
            raise AuthenticationError(f"Błąd wylogowania: {str(e)}")
        
    async def reset_password(self, login: str):
        try:
            # Inicjowanie resetowania hasła
            # W rzeczywistym scenariuszu konieczne będzie skonfigurowanie adresu URL do resetu hasła
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
            import jwt
            import os
            from auth.jwt import SECRET_KEY, ALGORITHM
            
            # Decode the token using the same secret key and algorithm as when creating
            payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Check if token contains user ID
            user_id = payload.get("sub")
            if not user_id:
                print("No user ID in token")
                return None
                
            # Get user data from Supabase
            try:
                user_response = self.supabase.auth.admin.get_user_by_id(user_id)
                
                if user_response and user_response.user:
                    user_data = {
                        "id": user_response.user.id,
                        "login": user_response.user.user_metadata.get("login")
                    }
                    print(f"Session validated successfully for user: {user_data['login']}")
                    return user_data
            except Exception as admin_error:
                # Fall back to using the token data if admin API access fails
                print(f"Admin API error: {str(admin_error)}")
                return {
                    "id": user_id,
                    "login": payload.get("login", "unknown")
                }
            
            print("No user found in Supabase response")
            return None
        except Exception as e:
            print(f"Session validation error: {str(e)}")
            return None 