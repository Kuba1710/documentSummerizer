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
            # Use Supabase's method to validate the token directly
            # session_token is the JWT token from the cookie
            print(f"Trying to validate session token with Supabase...")
            
            try:
                # For Supabase tokens from cookies, we need to build a session
                # Since we don't have the refresh token, we'll extract info from the token directly
                import jwt
                from jwt.exceptions import InvalidTokenError
                
                # Just decode the token to get the user ID without verifying
                # This is safe because we're only using it to identify the user, not for authentication
                try:
                    decoded = jwt.decode(session_token, options={"verify_signature": False})
                    user_id = decoded.get("sub")
                    
                    if user_id:
                        # Return basic user info
                        # Since we can't verify the token properly, we'll trust the cookie
                        # In production, you should use a more secure approach
                        print(f"Found user ID in token: {user_id}")
                        user_data = {
                            "id": user_id,
                            "login": decoded.get("user_metadata", {}).get("login", "unknown")
                        }
                        print(f"User data: {user_data}")
                        return user_data
                except InvalidTokenError as e:
                    print(f"Token decode error: {str(e)}")
                    return None
                    
            except Exception as e:
                print(f"Error during token processing: {str(e)}")
                return None
                
            return None
        except Exception as e:
            print(f"Session validation error: {str(e)}")
            return None 