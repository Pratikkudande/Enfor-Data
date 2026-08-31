package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	// Read DATABASE_URL from environment or use default
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://neondb_owner:npg_m5EJ1AlZDkse@54.209.204.248/Enfor_Data?sslmode=require&options=endpoint%3Dep-hidden-dream-amhek2qw"
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("✓ Connected to database")

	// Fix 1: Update any NULL or empty categories
	fmt.Println("\n1. Updating templates with NULL or empty categories...")
	result, err := db.Exec(`
		UPDATE sms_dlt_templates 
		SET category = 'SERVICES' 
		WHERE category IS NULL OR category = ''
	`)
	if err != nil {
		log.Printf("Warning: Failed to update NULL categories: %v\n", err)
	} else {
		rows, _ := result.RowsAffected()
		fmt.Printf("   ✓ Updated %d templates\n", rows)
	}

	// Fix 2: Add constraint if it doesn't exist
	fmt.Println("\n2. Ensuring check constraint exists...")
	_, err = db.Exec(`
		DO $$ 
		BEGIN
			IF NOT EXISTS (
				SELECT 1 
				FROM information_schema.constraint_column_usage 
				WHERE constraint_name = 'check_category' 
				AND table_name = 'sms_dlt_templates'
			) THEN
				ALTER TABLE sms_dlt_templates
				ADD CONSTRAINT check_category CHECK (category IN ('FOR_SALE', 'FOR_RENT', 'FOR_BUY', 'LIST_FOR_RENT', 'SERVICES'));
			END IF;
		END $$;
	`)
	if err != nil {
		log.Printf("Warning: Failed to add constraint: %v\n", err)
	} else {
		fmt.Println("   ✓ Constraint verified")
	}

	// Fix 3: Create index
	fmt.Println("\n3. Creating index on category...")
	_, err = db.Exec(`
		DO $$ 
		BEGIN
			IF NOT EXISTS (
				SELECT 1 
				FROM pg_indexes 
				WHERE tablename = 'sms_dlt_templates' 
				AND indexname = 'idx_sms_dlt_templates_category'
			) THEN
				CREATE INDEX idx_sms_dlt_templates_category ON sms_dlt_templates(category);
			END IF;
		END $$;
	`)
	if err != nil {
		log.Printf("Warning: Failed to create index: %v\n", err)
	} else {
		fmt.Println("   ✓ Index created/verified")
	}

	// Verify fix
	fmt.Println("\n4. Verifying fix...")
	var count int
	err = db.QueryRow(`
		SELECT COUNT(*) 
		FROM sms_dlt_templates 
		WHERE category IS NULL OR category = '' OR category NOT IN ('FOR_SALE', 'FOR_RENT', 'FOR_BUY', 'LIST_FOR_RENT', 'SERVICES')
	`).Scan(&count)
	if err != nil {
		log.Printf("Warning: Failed to verify: %v\n", err)
	} else if count > 0 {
		fmt.Printf("   ⚠ Warning: %d templates still have invalid categories\n", count)
	} else {
		fmt.Println("   ✓ All templates have valid categories")
	}

	// Show category distribution
	fmt.Println("\n5. Category distribution:")
	rows, err := db.Query(`
		SELECT category, COUNT(*) 
		FROM sms_dlt_templates 
		GROUP BY category 
		ORDER BY COUNT(*) DESC
	`)
	if err != nil {
		log.Printf("Warning: Failed to get distribution: %v\n", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var category string
			var count int
			if err := rows.Scan(&category, &count); err == nil {
				fmt.Printf("   %s: %d templates\n", category, count)
			}
		}
	}

	fmt.Println("\n✓ Database fix completed successfully!")
	fmt.Println("\nYou can now:")
	fmt.Println("  1. Restart your backend: go run cmd/api/main.go")
	fmt.Println("  2. Try editing templates in the admin panel")
}
