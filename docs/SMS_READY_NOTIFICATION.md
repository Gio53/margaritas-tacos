# SMS notifications (Twilio)

Customers can receive **two** kinds of texts when Twilio is configured:

1. **Right after they place an order** (if they entered a phone number):  
   *"Thank you for ordering Margaritas Tacos, Your Order will take 30-40 minutes to complete"*

2. **When you mark the order Ready** in Admin:  
   *"Your Margaritas Tacos order is ready for pickup!"*

Email (Resend) is optional for order-ready only — see below.

---

## SMS — Twilio (primary)

Set these on the server so customers get texts (order placed + order ready):

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio number in E.164, e.g. `+15165551234` |

1. Create an account at [twilio.com](https://www.twilio.com/).
2. In the [Twilio Console](https://console.twilio.com/): get your **Account SID** and **Auth Token**, and buy a **phone number** (Phone Numbers → Manage → Buy a number).
3. Add the three env vars above to your server `.env` (or Render/env).

**Order placed:** *"Thank you for ordering Margaritas Tacos, Your Order will take 30-40 minutes to complete"*  
**Order ready:** *"Your Margaritas Tacos order is ready for pickup!"*

---

## Email — optional (for later)

If you want to add **email** later (e.g. order-ready emails or email ads), you can use **Resend** (100 emails/day free):

- `RESEND_API_KEY` — from [resend.com](https://resend.com)
- `RESEND_FROM_EMAIL` — optional; e.g. `orders@yourdomain.com` after you verify your domain

If these are set, the server will also send an email when the order is marked ready. If not set, only SMS is sent (when Twilio is configured).

---

## Summary

- **SMS (Twilio)** — primary “order ready” notification. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- **Email (Resend)** — optional. Add `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL`) when you’re ready to use email.
