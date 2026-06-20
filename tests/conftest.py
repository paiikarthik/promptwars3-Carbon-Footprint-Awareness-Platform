import os
import sys
import tempfile

os.environ.setdefault(
    "LOCAL_DB_PATH",
    os.path.join(tempfile.gettempdir(), "ecoai_guardian_test_local_db.json"),
)

# Inject backend path into sys.path to allow tests to import modules correctly
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend")
sys.path.insert(0, backend_path)
