import subprocess, sys
from pathlib import Path
root = Path(__file__).resolve().parent
backend = root / "backend"
checks = [
    ([sys.executable, str(backend / "tests" / "test_backend.py")], backend),
    ([sys.executable, str(backend / "tests" / "test_api_routes.py")], backend),
    ([sys.executable, str(root / "tests" / "test_frontend_static.py")], root),
]
ok = True
for cmd, cwd in checks:
    print("RUN", " ".join(map(str, cmd)))
    result = subprocess.run(cmd, cwd=str(cwd), text=True)
    if result.returncode != 0: ok = False
raise SystemExit(0 if ok else 1)
