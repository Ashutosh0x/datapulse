import os
import sys

# Add project root to sys.path so 'backend' can be resolved
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.api_gateway.src.main import app
