from pydantic import BaseModel, Field, validator
import re

class RegisterSchema(BaseModel):
    login: str = Field(..., min_length=4)
    password: str = Field(..., min_length=8)
    password_confirmation: str = Field(...)
    
    @validator('login')
    def validate_login(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Login może zawierać tylko litery, cyfry i podkreślnik')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[A-Z])(?=.*\d).+$', v):
            raise ValueError('Hasło musi zawierać co najmniej jedną dużą literę i jedną cyfrę')
        return v
    
    @validator('password_confirmation')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Hasła nie są identyczne')
        return v

class LoginSchema(BaseModel):
    login: str
    password: str

class ResetPasswordSchema(BaseModel):
    login: str

class SetNewPasswordSchema(BaseModel):
    token: str
    password: str = Field(..., min_length=8)
    password_confirmation: str
    
    @validator('password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[A-Z])(?=.*\d).+$', v):
            raise ValueError('Hasło musi zawierać co najmniej jedną dużą literę i jedną cyfrę')
        return v
    
    @validator('password_confirmation')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Hasła nie są identyczne')
        return v 