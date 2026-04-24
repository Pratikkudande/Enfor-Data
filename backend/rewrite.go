package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	err := filepath.Walk("internal", func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(path, ".go") && !strings.Contains(path, "dto") && !strings.Contains(path, "models") {
			content, err := os.ReadFile(path)
			if err != nil {
				return err
			}

			// We need to add "enfor-data-backend/internal/dto" to the imports if it's not there and we are replacing something.
			needsDtoImport := false

			originalContent := string(content)
			newContent := originalContent

			replacements := []string{
				"CreateAppointmentRequest", "UpdateAppointmentRequest", "AppointmentStats", "AppointmentFilters",
				"CreateClientRequest", "UpdateClientRequest",
				"CreatePropertyRequest", "UpdatePropertyRequest",
				"SignupRequest", "LoginRequest", "LoginResponse", "PublicUser",
			}

			for _, req := range replacements {
				if strings.Contains(newContent, "models."+req) {
					newContent = strings.ReplaceAll(newContent, "models."+req, "dto."+req)
					needsDtoImport = true
				}
			}

			if needsDtoImport {
				// Add import if missing
				if !strings.Contains(newContent, `"enfor-data-backend/internal/dto"`) {
					// Find the imports block and insert it
					if strings.Contains(newContent, "import (") {
						newContent = strings.Replace(newContent, "import (", "import (\n\t\"enfor-data-backend/internal/dto\"", 1)
					} else {
						// Single import or none? Let's just find "enfor-data-backend/internal/models"
						if strings.Contains(newContent, "\"enfor-data-backend/internal/models\"") {
							newContent = strings.Replace(newContent, "\"enfor-data-backend/internal/models\"", "\"enfor-data-backend/internal/models\"\n\t\"enfor-data-backend/internal/dto\"", 1)
						}
					}
				}

				err = os.WriteFile(path, []byte(newContent), 0644)
				if err != nil {
					return err
				}
				fmt.Println("Updated:", path)
			}
		}
		return nil
	})

	if err != nil {
		panic(err)
	}
}
