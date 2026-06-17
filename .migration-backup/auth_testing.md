# PoH Auth Testing Playbook

## Credentials
- Admin/owner: `analyst@poh.io` / `PohDemo2026!`

## API checks
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"analyst@poh.io","password":"PohDemo2026!"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
- Login returns the user object and sets `access_token` + `refresh_token` cookies.
- `/api/auth/me` returns the same user using those cookies.
- Register: POST /api/auth/register {name,email,password,company} -> creates a user + new workspace + default SDK key.
- Brute force: 5 failed logins from same ip:email -> 429 lockout (15 min).

## Notes for testing agent
- Cookies are httpOnly + secure + samesite=none. When testing via browser automation on the HTTPS preview URL, cookies are sent automatically (axios withCredentials).
- Protected dashboard APIs require a valid session; unauthenticated -> 401.
