# Onboarding a New FOC to TuTrack

> **Who this is for:** Tunet admin staff (NOC leads) responsible for setting up new Field Operations Crew (FOC) members.
> **Time required:** ~3 minutes per FOC, most of it on the FOC's side.

## Overview

Adding a new FOC to TuTrack is a two-step process:

1. **You (admin)** create the FOC's account in TuTrack and get a 4-digit PIN for them.
2. **The FOC** opens Telegram, finds the TuTrack bot, and sends the PIN to link their phone to the system.

After this, the FOC automatically receives Telegram notifications when NOC assigns them a task, and their location shows up on the radar map when they share it via Telegram.

You never have to type a Telegram "chat ID" or any technical identifier — the system handles that automatically.

---

## Part 1 — Create the FOC's Account (Admin)

### Step 1: Open Team Management
- Log in to TuTrack with your admin PIN.
- In the sidebar, click **Team Management** (or go to `/dashboard/admin/users`).

### Step 2: Click "Bulk Add"
- In the top-right of the page, next to the **Add Staff** button, click **Bulk Add**.
- A dialog opens with a large text box.

### Step 3: Paste FOC Details
Enter one FOC per line in this format:

```
Full Name, Phone Number, [PIN], [@telegram]
```

Examples:
```
Ahmad Fauzi, 081234567890,
Budi Santoso, 081234567891, 2345,
Citra Lestari, 081234567892, , @citra_work
Dewi Ratna, 081234567893,
```

**Column rules:**

| Column     | Required? | Notes                                                                            |
| ---------- | --------- | -------------------------------------------------------------------------------- |
| Name       | Yes       | Full name as it should appear in TuTrack                                        |
| Phone      | Yes       | Any format — used for admin contact only                                        |
| PIN        | Optional  | Leave blank to auto-generate one for you                                        |
| @telegram  | Optional  | Only if the FOC already has a public Telegram handle. Most FOCs can leave blank. |

If you keep the **"Auto-generate PIN if blank"** option checked (default on), any blank PIN column gets a random 4-digit number.

**Role dropdown:** all pasted staff get the same role. Default is FOC. Switch to NOC or Admin only if you're bulk-adding those roles.

### Step 4: Submit
- Click **Add Staff**.
- Wait for the result. Each row shows either:
  - Green check — FOC created (with their PIN if auto-generated)
  - Red X with reason — skipped (usually duplicate phone)

### Step 5: Copy the PINs
After submit, a results box appears listing every created FOC with their PIN. **Copy this block now** — you'll need it for the next part. You can use the **Copy PINs** button to copy the entire list to your clipboard.

Example output:

```
Ahmad Fauzi — PIN: 4521
Budi Santoso — PIN: 2345
Citra Lestari — PIN: 8932
Dewi Ratna — PIN: 1207
```

Click **Done** to close the dialog, or **Add More** to paste another batch.

---

## Part 2 — Send Setup Instructions to Each FOC (Admin)

For each FOC, send them a WhatsApp message using this template (copy/paste, fill in the name and PIN):

```
Halo [Nama]!

Saya daftarkan Anda di TuTrack, aplikasi manajemen tugas tim kita.

PIN Anda: [PIN]

Setup Telegram (sekitar 2 menit):
1. Buka aplikasi Telegram di HP kamu
2. Di search bar, ketik: @TuTrackTrackingBot
3. Klik bot tersebut, lalu ketik: /start
4. Bot akan membalas dengan instruksi
5. Kirim PIN kamu (4 digit angka) ke bot tersebut
6. Selesai! Kamu akan terima notifikasi tugas di chat itu

Kalau ada error atau bot tidak membalas, balas chat ini.
```

**Why a separate WhatsApp per FOC:** each one has a different PIN and the PIN is what binds their phone to their account. Don't share PINs in a group chat.

---

## Part 3 — FOC Links Their Telegram (FOC's Job)

Hand off to the FOC. They follow these steps on their own phone:

### Step 1: Open Telegram
- Open the Telegram app on their phone.

### Step 2: Find the TuTrack Bot
- In the search bar (magnifying glass icon), type: `@TuTrackTrackingBot`
- Tap the bot result that has the official TuTrack profile picture/handle.

### Step 3: Send /start
- Tap **Start** or type `/start` and send.

The bot replies in Indonesian:

```
👋 Selamat datang di TuTrack!

Untuk menghubungkan akun Anda:
1. Kirim PIN 4-digit Anda (contoh: 1234)
2. Sistem akan otomatis mengikat akun Anda
3. Anda akan menerima notifikasi tugas di sini

Belum tahu PIN? Hubungi admin Anda.
```

### Step 4: Send the PIN
- Type the 4-digit PIN the admin gave them (just the numbers, nothing else) and send.

### Step 5: Confirmation
The bot replies with one of:

**Success (first time linking):**
```
✅ Terhubung ke TuTrack sebagai Ahmad Fauzi.

Anda akan menerima notifikasi tugas di sini. Untuk share lokasi, tap 📎 → Location → Share.
```

**Already linked (they re-sent the PIN, or you tested):**
```
✅ Anda sudah terhubung ke TuTrack sebagai Ahmad Fauzi.

Kirim /help untuk melihat perintah yang tersedia.
```

**Wrong PIN:**
```
❌ PIN tidak dikenali. Silakan hubungi admin untuk PIN yang benar.
```

If they get "wrong PIN", have them message you back. Double-check the PIN, re-send the correct one if needed.

### Done!
The FOC is now linked. They'll automatically receive:
- A Telegram message whenever NOC assigns them a new task (with full task details)
- A second message with a "Share Location" button so they can appear on the radar

---

## Part 4 — Verify It Works (Admin)

After each FOC finishes Part 3, verify from the admin dashboard:

### Check 1: Confirm the FOC's PIN worked
- In Telegram, ask the FOC if they got the "Terhubung ke TuTrack" confirmation message.
- If yes, the binding succeeded.

### Check 2: Send a Test Task
- In TuTrack, go to **Tasks** (`/dashboard/tasks`).
- Click **New Task**, create a task, and **assign it to that FOC**.
- Within 5–10 seconds, the FOC should receive a Telegram message on their phone with the full task details (title, location, priority, deadline, description).
- If the FOC does NOT receive the message, see Troubleshooting below.

### Check 3: Test Live Location
- In the FOC's Telegram chat with the bot, send a location (tap the paperclip icon, then Location, then Share).
- Back in TuTrack, go to **Map** (`/dashboard/map`).
- The FOC's marker should appear at the location they shared.

---

## Troubleshooting

### FOC says "PIN tidak dikenali" (PIN not recognized)
- Check the spelling of the PIN the FOC typed. They may have included a space or extra digit.
- Verify the PIN matches what the system shows. Go to Team Management → click Edit on the FOC → check the PIN field.
- If the PIN is correct in the system but the FOC still gets rejected, they may have typed the wrong one. Re-send the correct PIN.

### FOC doesn't get a Telegram message after a task is assigned
Possible causes (in order of likelihood):

1. **FOC forgot to complete Part 3.** Have them re-send `/start` to the bot and check that they got the "Terhubung" confirmation.
2. **Bot webhook is down.** As admin, run:
   ```
   curl https://tunettracking.vercel.app/api/telegram/setup
   ```
   It should return `"ok": true`. If not, the Telegram bot can't receive messages.
3. **Supabase webhook is down.** Check Vercel logs and the Supabase Dashboard → Database → Webhooks. The webhook should point at `/api/webhooks/supabase/notifications` and show recent successful deliveries.

### FOC's location doesn't appear on the map
- Make sure the FOC shared their location AFTER linking (Step 5). If they shared before, their location was rejected.
- Have them re-share: tap the paperclip icon → Location → Share My Location.
- The map auto-refreshes; ask them to wait 10 seconds.

### FOC's Telegram username is wrong / changed
- Telegram `@username` is saved opportunistically. The PIN is the source of truth. If the FOC changes their Telegram username, the binding is unaffected.
- If you need to manually fix a broken link, edit the FOC in Team Management and clear the Telegram field. They re-send `/start` and the PIN to re-link.

### FOC unlinks accidentally
- A FOC can unlink if they get a new phone number (which has a different Telegram chat_id). To re-link, they just re-send `/start` and their same PIN.

---

## FAQ

**Q: Can a FOC have more than one Telegram account linked?**
A: No. The system stores one `chat_id` per FOC. If they switch phones, the new Telegram account must complete Part 3 again with their PIN. The old chat_id is replaced.

**Q: Can I bulk-link multiple FOCs at once?**
A: No — each FOC must type their own PIN on their own phone, since the link is per-phone. But the admin's Part 1 is bulk (you can paste all 8 in one go).

**Q: What if the FOC doesn't have Telegram?**
A: TuTrack requires Telegram for the radar map and notifications. If the FOC doesn't have Telegram installed, they need to install it (free) and create an account first. Then proceed with Part 3.

**Q: Can the PIN be the same as their login PIN?**
A: Yes — the linking PIN and the login PIN are the same number. One 4-digit code does both jobs.

**Q: What if the FOC's phone is lost/stolen?**
A: In Team Management, click the FOC → Edit → clear the Telegram field. The old phone is unlinked. When the FOC gets a new phone, they re-do Part 3 with their same PIN.

**Q: Is the PIN secure?**
A: The PIN is a 4-digit number, intended for trusted internal staff. Anyone who knows the FOC's PIN could theoretically link their own Telegram to that FOC's account. This is acceptable for a small trusted team. If you need stronger security, ask your developer about adding a one-time confirmation step (a 6-digit code from the FOC's dashboard).

**Q: Do I need to keep the auto-generated PINs anywhere?**
A: Yes — keep a record (in your password manager, a printed sheet, etc.). The system does not display PINs in plain text after creation (only as `****` unless you click the eye icon).

---

## Quick Reference Card

For printing and pinning in the office:

```
+------------------------------------------------------------+
|  TUTRACK - FOC ONBOARDING (1-PAGE REFERENCE)              |
|                                                            |
|  ADMIN (you):                                              |
|   1. Team Management -> Bulk Add                          |
|   2. Paste:  Name, Phone, [PIN], [@telegram]              |
|   3. Submit, copy the PINs                                |
|   4. WhatsApp each FOC their PIN + the steps below        |
|                                                            |
|  FOC (5 min on their phone):                               |
|   1. Open Telegram                                         |
|   2. Search: @TuTrackTrackingBot                           |
|   3. Send: /start                                          |
|   4. Send: <4-digit PIN>                                   |
|   5. Wait for "Terhubung" confirmation                    |
|                                                            |
|  RESULT: FOC gets Telegram task alerts + appears          |
|  on the radar map when they share location.                |
+------------------------------------------------------------+
```
