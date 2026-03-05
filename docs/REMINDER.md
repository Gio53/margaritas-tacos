# Reminder — Notify customer when order is ready

**You asked to be reminded:** When you press **Mark ready** in Admin, the customer gets notified that their order is ready.

**Status:** Implemented. **SMS (Twilio)** is the main notification. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` on the server. **Email (Resend)** is optional for later (ads, etc.) — see **docs/SMS_READY_NOTIFICATION.md**.
