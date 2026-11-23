"""
CyberNexus v2 Test Runner
=========================
Executes all unit and integration tests across tests_v2/.
"""

import sys
import unittest
from pathlib import Path

# Add project root and virtual environment site-packages if available
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

VENV_SITE_PACKAGES = Path("C:/Users/ASUS/OneDrive/Desktop/CyberNexus/.venv/Lib/site-packages")
if VENV_SITE_PACKAGES.exists() and str(VENV_SITE_PACKAGES) not in sys.path:
    sys.path.insert(0, str(VENV_SITE_PACKAGES))


def run_all_tests():
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=str(Path(__file__).parent), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
