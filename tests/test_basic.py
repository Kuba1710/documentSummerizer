import os
import sys

# Add the current directory to the path so that Python can find our modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def test_pytest_works():
    """Basic test to verify pytest is working correctly."""
    assert True

def test_environment_setup():
    """Test that confirms the testing environment is properly set up."""
    # This test will always pass, but serves as a placeholder 
    # to verify the CI environment is correctly configured
    assert 1 + 1 == 2

def test_environment_variables():
    """Test that necessary environment variables are available."""
    # DATABASE_URL may not be set, but we should at least have PYTHONPATH
    assert "PYTHONPATH" in os.environ
    print(f"PYTHONPATH is set to: {os.environ.get('PYTHONPATH')}")

def test_import_basics():
    """Test that we can import basic modules needed."""
    import fastapi
    import pytest
    import jinja2
    assert fastapi.__name__ == "fastapi"
    assert pytest.__name__ == "pytest"
    assert jinja2.__name__ == "jinja2" 