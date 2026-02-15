# Quick Setup Guide - Ntfy.sh Push Notifications

## 🚀 Quick Start (5 menit)

### 1. Install Ntfy App di HP Farhan

**Android:** https://play.google.com/store/apps/details?id=io.heckel.ntfy  
**iOS:** https://apps.apple.com/app/ntfy/id1625396347

### 2. Subscribe ke Topic

1. Buka app **ntfy**
2. Tap **"+"**
3. Masukkan topic: `farhan-vip-whatsapp`
4. Subscribe

### 3. Set Urgent Priority

1. **Long press** topic → **Settings**
2. **Override Do Not Disturb:** ON ⭐
3. **Notification importance:** Urgent/High
4. **Sound:** ON

### 4. Update .env

```bash
# Di file .env (buat jika belum ada)
NTFY_TOPIC=farhan-vip-whatsapp
```

### 5. Test Notification

**Option A: Via Test Script**

```bash
npx ts-node test-ntfy.ts
```

**Option B: Via Browser**

1. Buka: https://ntfy.sh/farhan-vip-whatsapp
2. Kirim test message

**Option C: Via Curl**

```bash
curl -d "Test" -H "Priority: urgent" https://ntfy.sh/farhan-vip-whatsapp
```

### 6. Run Bot

```bash
npm run dev
```

---

## ✅ Verification

Jika setup benar:

- ✅ Test notification masuk ke HP
- ✅ **Bunyi/getar meski HP silent**
- ✅ Console log: `📱 Notification service initialized for ntfy topic: farhan-vip-whatsapp`

## 🎯 Usage

Ketika VIP (Viia) chat setelah jam 9 malam:

- Bot kirim auto-reply sweet ke Viia
- **HP Farhan dapat push notification urgent** (bunyi meski silent!)
- Farhan bisa langsung buka WhatsApp

---

**Lengkapnya:** Baca `walkthrough.md`
