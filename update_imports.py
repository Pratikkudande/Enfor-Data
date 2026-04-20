import os

def update_imports(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace plural with singular for internal packages
    content = content.replace('"enfor-data-backend/internal/handlers"', '"enfor-data-backend/internal/handler"')
    content = content.replace('"enfor-data-backend/internal/services"', '"enfor-data-backend/internal/service"')
    content = content.replace('"enfor-data-backend/internal/utils"', '"enfor-data-backend/internal/utils"')
    content = content.replace('handlers.', 'handler.')
    content = content.replace('services.', 'service.')
    
    with open(file_path, 'w') as f:
        f.write(content)

base = "backend"
for root, dirs, files in os.walk(base):
    for file in files:
        if file.endswith('.go'):
            update_imports(os.path.join(root, file))

print("Imports updated")
