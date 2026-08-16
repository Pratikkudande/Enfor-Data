package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	_ "github.com/lib/pq"
)

func main() {
	// Connect to database
	dbURL := "postgres://neondb_owner:npg_m5EJ1AlZDkse@54.209.204.248/Enfor_Data?sslmode=require&options=endpoint%3Dep-hidden-dream-amhek2qw"
	
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer db.Close()

	templateID := "4e1287cb-b109-4f20-a16d-d2e51116ae23"

	// Check current template
	fmt.Println("Checking template:", templateID)
	fmt.Println(strings.Repeat("-", 80))
	
	var id, templateName, category, status string
	var categoryNull sql.NullString
	
	err = db.QueryRow(`
		SELECT id, template_name, category, status 
		FROM sms_dlt_templates 
		WHERE id = $1
	`, templateID).Scan(&id, &templateName, &categoryNull, &status)
	
	if err != nil {
		log.Fatal("Template not found:", err)
	}

	if categoryNull.Valid {
		category = categoryNull.String
	} else {
		category = "NULL"
	}

	fmt.Printf("Template Name: %s\n", templateName)
	fmt.Printf("Category: %s\n", category)
	fmt.Printf("Status: %s\n", status)
	fmt.Println()

	// Check if category is valid
	validCategories := []string{"FOR_SALE", "FOR_RENT", "FOR_BUY", "LIST_FOR_RENT", "SERVICES"}
	isValid := false
	for _, valid := range validCategories {
		if category == valid {
			isValid = true
			break
		}
	}

	if !isValid {
		fmt.Printf("❌ INVALID CATEGORY: '%s'\n", category)
		fmt.Println("\nFixing template...")
		
		_, err = db.Exec(`
			UPDATE sms_dlt_templates 
			SET category = 'SERVICES' 
			WHERE id = $1
		`, templateID)
		
		if err != nil {
			log.Fatal("Failed to fix:", err)
		}
		
		fmt.Println("✅ Template fixed! Category set to 'SERVICES'")
	} else {
		fmt.Printf("✅ Category '%s' is valid\n", category)
	}

	// Show all templates with their categories
	fmt.Println("\n" + strings.Repeat("-", 80))
	fmt.Println("All templates:")
	fmt.Println(strings.Repeat("-", 80))
	
	rows, err := db.Query(`
		SELECT id, template_name, 
		       COALESCE(category, 'NULL') as category, 
		       status 
		FROM sms_dlt_templates 
		ORDER BY created_at DESC
	`)
	if err != nil {
		log.Fatal("Failed to query:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, name, cat, stat string
		rows.Scan(&id, &name, &cat, &stat)
		
		// Check if valid
		validIcon := "✅"
		for _, valid := range validCategories {
			if cat == valid {
				validIcon = "✅"
				break
			}
		}
		if cat == "NULL" || cat == "" {
			validIcon = "❌"
		}
		
		fmt.Printf("%s %-36s | %-30s | %-15s | %s\n", validIcon, id[:36], name, cat, stat)
	}
}
