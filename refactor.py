import os
import shutil

# Backend Restructuring
def refactor_backend():
    base = "backend"
    new_dirs = [
        "cmd/api", "internal/config", "internal/handler", "internal/middleware",
        "internal/service", "internal/repository", "internal/models",
        "internal/dto", "internal/utils", "pkg", "migrations"
    ]
    
    # Create new dirs
    for d in new_dirs:
        os.makedirs(os.path.join(base, d), exist_ok=True)
    
    # Move main.go
    if os.path.exists(os.path.join(base, "cmd/server/main.go")):
        shutil.move(os.path.join(base, "cmd/server/main.go"), os.path.join(base, "cmd/api/main.go"))
    
    # Move models
    if os.path.exists(os.path.join(base, "internal/models")):
        for f in os.listdir(os.path.join(base, "internal/models")):
            if f.endswith('.go'):
                pass # Already in internal/models
    
    # Actually, we need to carefully move things from plural to singular folders
    mapping = {
        "internal/handlers": "internal/handler",
        "internal/services": "internal/service",
        "internal/utils": "internal/utils",
    }
    
    for old_dir, new_dir in mapping.items():
        old_path = os.path.join(base, old_dir)
        new_path = os.path.join(base, new_dir)
        if os.path.exists(old_path) and old_path != new_path:
            for f in os.listdir(old_path):
                shutil.move(os.path.join(old_path, f), os.path.join(new_path, f))
            try:
                os.rmdir(old_path)
            except:
                pass

refactor_backend()
print("Backend refactored")
