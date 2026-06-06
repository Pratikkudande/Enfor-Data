package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load config
	if err := godotenv.Load("../../config.env"); err != nil {
		godotenv.Load("./config.env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL not set in config.env")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Cannot reach database:", err)
	}

	// Get admin details from args or use defaults
	email := "admin@enfordata.com"
	password := "Admin@123"
	firstName := "Super"
	lastName := "Admin"

	if len(os.Args) >= 3 {
		email = os.Args[1]
		password = os.Args[2]
	}
	if len(os.Args) >= 5 {
		firstName = os.Args[3]
		lastName = os.Args[4]
	}

	// Check if user already exists
	var existingID string
	err = db.QueryRow(`SELECT id FROM users WHERE email = $1`, email).Scan(&existingID)
	if err == nil {
		// User exists — just update role to admin
		_, err = db.Exec(`UPDATE users SET role = 'admin', is_active = TRUE, is_blocked = FALSE WHERE id = $1`, existingID)
		if err != nil {
			log.Fatal("Failed to update user role:", err)
		}
		fmt.Printf("\n✓ Existing user '%s' has been promoted to admin.\n", email)
		fmt.Printf("  User ID: %s\n\n", existingID)
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	// Insert admin user
	var adminID string
	err = db.QueryRow(`
		INSERT INTO users (
			first_name, last_name, email, password_hash, role,
			firm_name, whatsapp_number, address, location, city, state, postal_code,
			is_active, is_verified
		) VALUES ($1,$2,$3,$4,'admin','EnforData','0000000000','Admin Office','Admin','Mumbai','Maharashtra','400001',TRUE,TRUE)
		RETURNING id
	`, firstName, lastName, email, string(hash)).Scan(&adminID)

	if err != nil {
		log.Fatal("Failed to create admin user:", err)
	}

	fmt.Printf("\n✓ Admin user created successfully!\n")
	fmt.Printf("  Email   : %s\n", email)
	fmt.Printf("  Password: %s\n", password)
	fmt.Printf("  User ID : %s\n", adminID)
	fmt.Println("\n  Login at: http://localhost:3000/login")
	fmt.Println("  Admin panel: http://localhost:3000/admin/dashboard\n")
}
