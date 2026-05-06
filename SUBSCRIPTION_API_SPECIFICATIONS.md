# Subscription System - API Specifications

## Base URL
```
Development: http://localhost:8080/api
Production: https://api.enfor.com/api
```

## Authentication
All endpoints (except public ones) require JWT Bearer token:
```
Authorization: Bearer <access_token>
```

---

## 1. OTP ENDPOINTS

### 1.1 Send OTP
**Endpoint:** `POST /auth/send-otp`

**Purpose:** Send OTP to mobile number for verification

**Request Body:**
```json
{
  "mobile_number": "+919876543210",
  "purpose": "registration" // or "login", "password_reset"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp_id": "uuid",
    "mobile_number": "+919876543210",
    "expires_at": "2026-04-27T12:10:00Z",
    "can_resend_at": "2026-04-27T12:01:00Z"
  }
}
```

**Error Responses:**
- `429 Too Many Requests`: Rate limit exceeded
- `400 Bad Request`: Invalid mobile number
- `500 Internal Server Error`: Failed to send OTP

---

### 1.2 Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Purpose:** Verify OTP code

**Request Body:**
```json
{
  "otp_id": "uuid",
  "mobile_number": "+919876543210",
  "otp_code": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Mobile number verified successfully",
  "data": {
    "verified": true,
    "user_id": "uuid",
    "trial_activated": true,
    "trial_ends_at": "2026-05-12T12:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid OTP
- `410 Gone`: OTP expired
- `429 Too Many Requests`: Max attempts exceeded
- `404 Not Found`: OTP not found

---

### 1.3 Resend OTP
**Endpoint:** `POST /auth/resend-otp`

**Purpose:** Resend OTP to mobile number

**Request Body:**
```json
{
  "otp_id": "uuid",
  "mobile_number": "+919876543210"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "otp_id": "uuid",
    "expires_at": "2026-04-27T12:10:00Z",
    "can_resend_at": "2026-04-27T12:01:00Z"
  }
}
```

---

## 2. SUBSCRIPTION PLAN ENDPOINTS

### 2.1 Get All Plans
**Endpoint:** `GET /subscriptions/plans`

**Purpose:** Get all available subscription plans

**Query Parameters:**
- `include_hidden` (optional): Include hidden plans (admin only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "uuid",
        "name": "starter",
        "display_name": "Starter Plan",
        "description": "Perfect for individual brokers",
        "monthly_price": 999.00,
        "annual_price": 9999.00,
        "currency": "INR",
        "features": {
          "max_properties": 50,
          "max_clients": 100,
          "max_appointments_per_month": null,
          "max_whatsapp_messages_per_month": 500,
          "max_sms_messages_per_month": 500,
          "max_broker_connections": 20,
          "max_business_posts_per_month": 5,
          "max_team_members": 1,
          "has_analytics": true,
          "has_advanced_analytics": false,
          "has_api_access": false
        },
        "is_popular": true
      }
    ]
  }
}
```

---

### 2.2 Get Current Subscription
**Endpoint:** `GET /subscriptions/current`

**Purpose:** Get user's current subscription details

**Headers:** Requires authentication

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "user_id": "uuid",
      "plan": {
        "id": "uuid",
        "name": "free_trial",
        "display_name": "Free Trial"
      },
      "status": "trial",
      "billing_cycle": "trial",
      "is_trial": true,
      "trial_starts_at": "2026-04-27T12:00:00Z",
      "trial_ends_at": "2026-05-12T12:00:00Z",
      "trial_days_remaining": 15,
      "current_period_start": "2026-04-27T12:00:00Z",
      "current_period_end": "2026-05-12T12:00:00Z",
      "cancel_at_period_end": false,
      "usage": {
        "properties": {
          "used": 3,
          "limit": 5,
          "percentage": 60
        },
        "clients": {
          "used": 7,
          "limit": 10,
          "percentage": 70
        },
        "appointments": {
          "used": 2,
          "limit": 5,
          "percentage": 40
        },
        "whatsapp_messages": {
          "used": 25,
          "limit": 50,
          "percentage": 50
        },
        "sms_messages": {
          "used": 10,
          "limit": 50,
          "percentage": 20
        }
      }
    }
  }
}
```

---

### 2.3 Create Subscription
**Endpoint:** `POST /subscriptions/create`

**Purpose:** Create a new paid subscription

**Headers:** Requires authentication

**Request Body:**
```json
{
  "plan_id": "uuid",
  "billing_cycle": "monthly", // or "annual"
  "payment_method": "razorpay"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription_id": "uuid",
    "razorpay_subscription_id": "sub_xxxxx",
    "checkout_url": "https://razorpay.com/checkout/...",
    "amount": 999.00,
    "currency": "INR"
  }
}
```

---

### 2.4 Upgrade Subscription
**Endpoint:** `POST /subscriptions/upgrade`

**Purpose:** Upgrade to a higher plan

**Headers:** Requires authentication

**Request Body:**
```json
{
  "new_plan_id": "uuid",
  "billing_cycle": "monthly"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription upgraded successfully",
  "data": {
    "subscription_id": "uuid",
    "prorated_amount": 1500.00,
    "checkout_url": "https://razorpay.com/checkout/...",
    "effective_date": "2026-04-27T12:00:00Z"
  }
}
```

---

### 2.5 Downgrade Subscription
**Endpoint:** `POST /subscriptions/downgrade`

**Purpose:** Downgrade to a lower plan

**Headers:** Requires authentication

**Request Body:**
```json
{
  "new_plan_id": "uuid",
  "effective_date": "end_of_period" // or "immediate"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription will be downgraded at the end of current period",
  "data": {
    "subscription_id": "uuid",
    "current_plan": "professional",
    "new_plan": "starter",
    "effective_date": "2026-05-27T12:00:00Z"
  }
}
```

---

### 2.6 Cancel Subscription
**Endpoint:** `POST /subscriptions/cancel`

**Purpose:** Cancel subscription

**Headers:** Requires authentication

**Request Body:**
```json
{
  "reason": "Too expensive",
  "feedback": "Optional feedback text",
  "cancel_immediately": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription_id": "uuid",
    "cancelled_at": "2026-04-27T12:00:00Z",
    "access_until": "2026-05-27T12:00:00Z"
  }
}
```

---

### 2.7 Resume Subscription
**Endpoint:** `POST /subscriptions/resume`

**Purpose:** Resume a cancelled subscription

**Headers:** Requires authentication

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription resumed successfully",
  "data": {
    "subscription_id": "uuid",
    "status": "active",
    "next_billing_date": "2026-05-27T12:00:00Z"
  }
}
```

---

### 2.8 Get Usage Statistics
**Endpoint:** `GET /subscriptions/usage`

**Purpose:** Get detailed usage statistics

**Headers:** Requires authentication

**Query Parameters:**
- `period` (optional): "current", "last_month", "all_time"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "current",
    "period_start": "2026-04-01T00:00:00Z",
    "period_end": "2026-04-30T23:59:59Z",
    "usage": {
      "properties": {
        "created": 3,
        "limit": 5,
        "percentage": 60,
        "can_create_more": true
      },
      "clients": {
        "created": 7,
        "limit": 10,
        "percentage": 70,
        "can_create_more": true
      },
      "appointments": {
        "created": 2,
        "limit": 5,
        "percentage": 40,
        "can_create_more": true
      },
      "whatsapp_messages": {
        "sent": 25,
        "limit": 50,
        "percentage": 50,
        "can_send_more": true
      },
      "sms_messages": {
        "sent": 10,
        "limit": 50,
        "percentage": 20,
        "can_send_more": true
      },
      "business_posts": {
        "created": 2,
        "limit": 5,
        "percentage": 40,
        "can_create_more": true
      }
    }
  }
}
```

---

## 3. PAYMENT ENDPOINTS

### 3.1 Create Payment Order
**Endpoint:** `POST /payments/create-order`

**Purpose:** Create Razorpay order for payment

**Headers:** Requires authentication

**Request Body:**
```json
{
  "subscription_id": "uuid",
  "amount": 999.00,
  "currency": "INR"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_id": "order_xxxxx",
    "amount": 999.00,
    "currency": "INR",
    "razorpay_key": "rzp_test_xxxxx"
  }
}
```

---

### 3.2 Verify Payment
**Endpoint:** `POST /payments/verify`

**Purpose:** Verify Razorpay payment signature

**Headers:** Requires authentication

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment_id": "uuid",
    "status": "success",
    "subscription_activated": true
  }
}
```

---

### 3.3 Get Payment History
**Endpoint:** `GET /payments/history`

**Purpose:** Get user's payment history

**Headers:** Requires authentication

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 999.00,
        "currency": "INR",
        "status": "success",
        "payment_method": "card",
        "description": "Starter Plan - Monthly",
        "invoice_number": "INV-2026-001",
        "receipt_url": "https://...",
        "paid_at": "2026-04-27T12:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    }
  }
}
```

---

### 3.4 Download Invoice
**Endpoint:** `GET /payments/invoice/:id`

**Purpose:** Download payment invoice PDF

**Headers:** Requires authentication

**Response:** PDF file download

---

### 3.5 Razorpay Webhook
**Endpoint:** `POST /webhooks/razorpay`

**Purpose:** Handle Razorpay webhook events

**Headers:**
- `X-Razorpay-Signature`: Webhook signature

**Request Body:** (varies by event type)
```json
{
  "event": "subscription.activated",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_xxxxx",
        "status": "active",
        ...
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## 4. FEATURE CHECK ENDPOINTS

### 4.1 Check Feature Access
**Endpoint:** `GET /features/check/:feature`

**Purpose:** Check if user can access a feature

**Headers:** Requires authentication

**Path Parameters:**
- `feature`: Feature name (e.g., "property_create", "whatsapp_send")

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "feature": "property_create",
    "can_use": true,
    "current_usage": 3,
    "limit": 5,
    "remaining": 2,
    "upgrade_required": false
  }
}
```

**Response (403 Forbidden) - Limit Reached:**
```json
{
  "success": false,
  "error": "Feature limit reached",
  "message": "You've reached the limit of 5 properties on your current plan",
  "data": {
    "feature": "property_create",
    "can_use": false,
    "current_usage": 5,
    "limit": 5,
    "remaining": 0,
    "upgrade_required": true,
    "recommended_plan": {
      "id": "uuid",
      "name": "starter",
      "display_name": "Starter Plan",
      "monthly_price": 999.00
    }
  }
}
```

---

### 4.2 Get All Feature Limits
**Endpoint:** `GET /features/limits`

**Purpose:** Get all feature limits for current plan

**Headers:** Requires authentication

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "free_trial",
      "display_name": "Free Trial"
    },
    "limits": {
      "properties": {
        "limit": 5,
        "used": 3,
        "remaining": 2,
        "unlimited": false
      },
      "clients": {
        "limit": 10,
        "used": 7,
        "remaining": 3,
        "unlimited": false
      },
      "appointments": {
        "limit": 5,
        "used": 2,
        "remaining": 3,
        "unlimited": false
      },
      "whatsapp_messages": {
        "limit": 50,
        "used": 25,
        "remaining": 25,
        "unlimited": false,
        "resets_at": "2026-05-01T00:00:00Z"
      },
      "sms_messages": {
        "limit": 50,
        "used": 10,
        "remaining": 40,
        "unlimited": false,
        "resets_at": "2026-05-01T00:00:00Z"
      },
      "broker_connections": {
        "limit": 0,
        "used": 0,
        "remaining": 0,
        "unlimited": false,
        "available_in_plan": "starter"
      },
      "business_posts": {
        "limit": 0,
        "used": 0,
        "remaining": 0,
        "unlimited": false,
        "available_in_plan": "starter"
      }
    }
  }
}
```

---

### 4.3 Track Feature Usage
**Endpoint:** `POST /features/track-usage`

**Purpose:** Track feature usage (internal use)

**Headers:** Requires authentication

**Request Body:**
```json
{
  "feature": "property_create",
  "action": "create",
  "resource_id": "uuid",
  "metadata": {
    "property_type": "apartment",
    "price": 5000000
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Usage tracked successfully"
}
```

---

## 5. ADMIN ENDPOINTS

### 5.1 Get All Subscriptions
**Endpoint:** `GET /admin/subscriptions`

**Purpose:** Get all user subscriptions (admin only)

**Headers:** Requires authentication + admin role

**Query Parameters:**
- `status` (optional): Filter by status
- `plan` (optional): Filter by plan
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "plan": {
          "name": "starter",
          "display_name": "Starter Plan"
        },
        "status": "active",
        "billing_cycle": "monthly",
        "current_period_end": "2026-05-27T12:00:00Z",
        "created_at": "2026-04-27T12:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### 5.2 Update User Subscription
**Endpoint:** `PUT /admin/subscriptions/:id`

**Purpose:** Manually update user subscription (admin only)

**Headers:** Requires authentication + admin role

**Request Body:**
```json
{
  "plan_id": "uuid",
  "status": "active",
  "extend_trial_days": 7,
  "reason": "Customer support request"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription updated successfully"
}
```

---

### 5.3 Get Analytics
**Endpoint:** `GET /admin/analytics`

**Purpose:** Get subscription analytics (admin only)

**Headers:** Requires authentication + admin role

**Query Parameters:**
- `period` (optional): "today", "week", "month", "year"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "metrics": {
      "total_users": 1250,
      "active_subscriptions": 450,
      "trial_users": 300,
      "trial_conversion_rate": 36.0,
      "mrr": 449550.00,
      "arr": 5394600.00,
      "churn_rate": 2.5,
      "arpu": 999.00
    },
    "plan_distribution": {
      "free_trial": 300,
      "starter": 250,
      "professional": 150,
      "enterprise": 50
    },
    "revenue_by_plan": {
      "starter": 249750.00,
      "professional": 374850.00,
      "enterprise": 150000.00
    }
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error title",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

## Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

**Document Version**: 1.0  
**Last Updated**: April 27, 2026
