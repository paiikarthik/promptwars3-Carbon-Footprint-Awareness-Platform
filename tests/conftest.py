import os
import sys

# Inject backend path into sys.path to allow tests to import modules correctly
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend")
sys.path.insert(0, backend_path)
