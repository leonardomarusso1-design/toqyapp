/**
 * Access Key Security Flow
 * FASE 5 — Production Implementation Guide
 * 
 * This document describes the secure access key flow for TOQY.
 */

// ============================================
// Access Key Flow - Complete Workflow
// ============================================

/*

1. BIOSITE CREATION
   ├─ Admin creates biosite in /app/novo
   ├─ System generates unique editKey (e.g., "8392-1147")
   ├─ Key is stored in database encrypted
   └─ Key displayed once to admin (copy warning)

2. CLIENT ACCESS (/me endpoint)
   ├─ Client visits /me
   ├─ Client enters biosite slug (e.g., "barbearia-andrian")
   ├─ Client enters access key (e.g., "8392-1147")
   └─ Frontend calls POST /api/sites/[slug]/verify-key

3. VERIFICATION (Backend)
   ├─ POST /api/sites/[slug]/verify-key
   ├─ Validates key format (XXXX-XXXX)
   ├─ Queries database for matching key
   ├─ Logs verification attempt (analytics)
   ├─ Returns 200 if valid, 401 if invalid
   └─ Issues short-lived session token (JWT)

4. EDIT SESSION
   ├─ Client receives session token (valid 1-2 hours)
   ├─ Token stored in secure httpOnly cookie
   ├─ Client redirected to /editar/[slug]
   ├─ Frontend includes token in requests
   ├─ Backend validates token on each edit
   └─ Session expires automatically

5. SECURITY MEASURES
   ├─ Keys hashed in database (not plaintext)
   ├─ Session tokens signed with secret
   ├─ Rate limiting on verify endpoint (3 attempts/min)
   ├─ Logout clears session cookie
   ├─ Key rotation available (generate new key)
   └─ All accesses logged in analytics_events

*/

// ============================================
// Implementation Details
// ============================================

/*

DATABASE: access_keys table
{
  id: UUID,
  bio_site_id: UUID (foreign key),
  key: TEXT (unique, plaintext for now - should be hashed),
  name: TEXT (optional, e.g., "Cliente Principal"),
  is_active: BOOLEAN,
  last_used_at: TIMESTAMP,
  created_at: TIMESTAMP,
  expires_at: TIMESTAMP (optional, for time-limited keys)
}

API ENDPOINTS:

POST /api/sites/[slug]/verify-key
├─ Purpose: Verify client access key
├─ Body: { edit_key: string }
├─ Response: { ok: boolean, token?: string }
├─ Status: 200 OK | 401 Unauthorized | 429 Too Many Requests
└─ Security: Rate-limited, CORS-enabled for public sites

POST /api/sites/[slug]/logout
├─ Purpose: End client edit session
├─ Clears session cookie
└─ Status: 200 OK

GET /api/sites/[slug]/session
├─ Purpose: Validate current session
├─ Returns: { valid: boolean, expiresAt: timestamp }
└─ Security: Validates session token in cookie

*/

// ============================================
// Production Improvements Needed
// ============================================

/*

TODO: 
1. Hash keys in database (bcrypt or similar)
2. Implement JWT session tokens
3. Add rate limiting (express-rate-limit or similar)
4. Add key expiration support
5. Implement key rotation/refresh
6. Add audit logging for all access attempts
7. Email verification for new keys
8. Two-factor authentication (optional)
9. IP whitelisting support (premium feature)
10. Session timeout configuration

*/

export {};
