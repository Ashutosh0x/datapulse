import os
import sys

# Add the project root and backend src to path
# Vercel flattens the structure slightly or runs from root
current_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_src = os.path.join(root_dir, "backend", "api_gateway", "src")

sys.path.append(root_dir)
sys.path.append(backend_src)

from main import app
