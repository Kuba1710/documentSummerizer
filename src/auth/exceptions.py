class AuthException(Exception):
    """Bazowy wyjątek dla błędów autentykacji"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class AuthenticationError(AuthException):
    """Wyjątek dla błędów logowania"""
    pass

class RegistrationError(AuthException):
    """Wyjątek dla błędów rejestracji"""
    pass

class ResetPasswordError(AuthException):
    """Wyjątek dla błędów resetowania hasła"""
    pass 