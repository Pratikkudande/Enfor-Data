import os

def update_package(file_path, old_pkg, new_pkg):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    for i in range(len(lines)):
        if lines[i].startswith(f"package {old_pkg}"):
            lines[i] = f"package {new_pkg}\n"
            break
            
    with open(file_path, 'w') as f:
        f.writelines(lines)

base = "backend"

handler_dir = os.path.join(base, "internal", "handler")
if os.path.exists(handler_dir):
    for f in os.listdir(handler_dir):
        if f.endswith(".go"):
            update_package(os.path.join(handler_dir, f), "handlers", "handler")

service_dir = os.path.join(base, "internal", "service")
if os.path.exists(service_dir):
    for f in os.listdir(service_dir):
        if f.endswith(".go"):
            update_package(os.path.join(service_dir, f), "services", "service")

print("Packages updated")
