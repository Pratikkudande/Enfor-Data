package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"enfor-data-backend/internal/config"
)

type EmailService struct {
	apiKey string
	from   string
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		apiKey: cfg.Resend.APIKey,
		from:   cfg.Resend.From,
	}
}

func (s *EmailService) SendOTPEmail(toEmail, otp string) error {
	if s.apiKey == "" {
		log.Printf("[EMAIL] No API key configured — skipping send to %s", toEmail)
		return nil
	}

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:30px;">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px;">
    <h2 style="color:#1a1a2e;margin-bottom:8px;">Password Reset OTP</h2>
    <p style="color:#555;font-size:14px;">Use the OTP below to reset your EnforData account password.</p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#8B5CF6);border-radius:12px;padding:20px 40px;">
        <span style="color:#fff;font-size:32px;font-weight:700;letter-spacing:10px;">%s</span>
      </div>
    </div>
    <p style="color:#888;font-size:13px;text-align:center;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
    <p style="color:#bbb;font-size:11px;text-align:center;">© EnforData · info@enfordata.com</p>
  </div>
</body>
</html>`, otp)

	payload := map[string]interface{}{
		"from":    fmt.Sprintf("EnforData <%s>", s.from),
		"to":      []string{toEmail},
		"subject": "Your EnforData Password Reset OTP",
		"html":    htmlBody,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to encode payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to reach Resend API: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		log.Printf("[EMAIL ERROR] Resend status %d: %s", resp.StatusCode, string(respBody))
		return fmt.Errorf("email delivery failed (status %d): %s", resp.StatusCode, string(respBody))
	}

	log.Printf("[EMAIL] OTP sent to %s (status %d)", toEmail, resp.StatusCode)
	return nil
}
