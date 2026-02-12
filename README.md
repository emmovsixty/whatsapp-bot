# Pampam AI 🤖

**Personal WhatsApp AI Assistant** - Production-ready WhatsApp bot using WhatsApp Cloud API and OpenAI

Automatically responds to selected contacts with AI-powered conversations when activated. Acts as your personal assistant, clearly identifies itself, and maintains natural conversational flow.

---

## ✨ Features

- **🔴🟢 ON/OFF Mode**: Toggle bot activation with simple HTTP endpoints
- **🔐 Whitelist System**: Only responds to 3-5 predefined trusted contacts
- **👋 Smart Intro**: Sends introduction message on first interaction per session
- **🤖 AI Responses**: Powered by OpenAI with conversation memory (last 5 messages)
- **💰 Cost Optimized**: Token limits and efficient memory to control OpenAI costs
- **🛡️ Spam Prevention**: Filters spam and duplicate messages
- **🇮🇩 Indonesian First**: Responds naturally in casual Indonesian
- **📊 Production Ready**: Clean architecture, error handling, and deployment-ready

---

## 🏗️ Architecture

```
WhatsApp User → Meta Cloud API → Webhook → Bot State Check
                                            ↓
                                    Whitelist Filter
                                            ↓
                                    Intro Message (if first time)
                                            ↓
                                    AI Service → OpenAI API
                                            ↓
                                    Response → WhatsApp
```

**Tech Stack**: Node.js, TypeScript, Express.js, WhatsApp Cloud API, OpenAI API

---

## 📋 Prerequisites

1. **Node.js** v18+ installed
2. **Meta Developer Account** with WhatsApp Business API access
3. **OpenAI API Key** from [platform.openai.com](https://platform.openai.com/)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd d:\Gabut\whatsapp-bot
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# WhatsApp Cloud API (from Meta Developer Portal)
WHATSAPP_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_custom_verify_token

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### 3. Configure Whitelist

Edit `src/config/whitelist.ts`:

```typescript
export const WHITELISTED_NUMBERS: string[] = [
  "628123456789", // Replace with real numbers
  "628987654321",
];
```

**Format**: Country code + number (no + or spaces)

### 4. Customize Bot Persona

Edit `src/config/persona.ts`:

```typescript
export const FOCUS_STATUS = "lagi fokus ngerjain backend project";
```

### 5. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 6. Expose Webhook (for testing)

Use [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

---

## 🔧 WhatsApp Cloud API Setup

### Step 1: Create Meta App

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create new app → **Business** type
3. Add **WhatsApp** product

### Step 2: Get Credentials

1. **Phone Number ID**: Found in WhatsApp → Getting Started
2. **Access Token**: Generate temporary token (24h) or permanent token
3. **Verify Token**: Create your own custom string (e.g., "pampam_verify_123")

### Step 3: Configure Webhook

1. Go to WhatsApp → Configuration
2. Click **Edit** on Webhook
3. Enter:
   - **Callback URL**: `https://your-domain.com/webhook` (or ngrok URL)
   - **Verify Token**: Same as in your `.env`
4. Subscribe to field: **messages**

### Step 4: Test

Send a test message to your WhatsApp Business number from a whitelisted number.

---

## 🎮 API Endpoints

### Bot Control

**Activate Bot**

```bash
POST http://localhost:3000/bot/on
```

**Deactivate Bot**

```bash
POST http://localhost:3000/bot/off
```

**Check Status**

```bash
GET http://localhost:3000/bot/status
```

Response:

```json
{
  "success": true,
  "active": true,
  "status": "ON",
  "introStates": {
    "628123456789": true
  }
}
```

### Webhook

**GET /webhook** - Meta verification (automated)  
**POST /webhook** - Incoming messages (automated)

---

## 📁 Project Structure

```
src/
├── config/
│   ├── openai.ts          # OpenAI client config
│   ├── persona.ts         # Bot personality & intro message
│   ├── whatsapp.ts        # WhatsApp API config
│   └── whitelist.ts       # Whitelisted phone numbers
├── services/
│   ├── ai.service.ts      # OpenAI integration
│   ├── bot-state.service.ts  # ON/OFF & intro state
│   ├── memory.service.ts  # Conversation history
│   └── whatsapp.service.ts   # Send messages
├── controllers/
│   ├── bot.controller.ts  # Bot control endpoints
│   └── webhook.controller.ts  # WhatsApp webhook
├── utils/
│   └── message-filter.ts  # Question detection & spam filter
├── app.ts                 # Express app setup
└── index.ts               # Entry point
```

---

## 💡 How It Works

### Message Flow

1. **User sends message** → WhatsApp Cloud API → Webhook
2. **Bot checks**: Is bot ON? Is number whitelisted?
3. **First message?** → Send intro, mark as sent
4. **Process with AI**: Get last 5 messages → OpenAI → Response
5. **Send response** → WhatsApp Cloud API → User

### Intro Message Logic

- **First activation**: Bot sends intro on first message from each user
- **Bot toggled OFF then ON**: Intro state resets, will send again
- **During same session**: Intro sent only once per user

### Conversation Memory

- Keeps **last 5 messages** per user (user + assistant)
- Sent to OpenAI for context
- **Cost control**: Limits context window size

---

## 💰 Cost Optimization

### Current Settings

- **Model**: `gpt-4o-mini` (~60% cheaper than GPT-4)
- **Max Tokens**: 150 per response
- **Memory**: Last 5 messages only
- **Whitelist**: Only 3-5 users

### Estimated Costs

- **Light usage** (50-100 msgs/day): ~$0.30-0.60/day
- **Moderate** (200-300 msgs/day): ~$1-2/day
- **Monthly** (3-5 users): ~$15-30/month

### Tips to Reduce Costs

1. Lower `OPENAI_CONFIG.maxTokens` in `src/config/openai.ts`
2. Reduce memory window (change `MAX_MESSAGES` in memory service)
3. Use cheaper model like `gpt-3.5-turbo`
4. Limit active hours (add time-based filtering)

---

## 🚀 Deployment

### Option 1: Railway (Recommended)

1. Create account at [railway.app](https://railway.app/)
2. **New Project** → **Deploy from GitHub**
3. Add environment variables in dashboard
4. railway will auto-detect Node.js and deploy
5. Copy the public URL for webhook

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables: `vercel env add`
4. Deploy changes: `vercel --prod`

**Note**: Vercel has 10s timeout on serverless functions. For long-running bots, use Railway.

### Option 3: VPS (DigitalOcean, Linode)

1. Set up Node.js on VPS
2. Clone repository
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Use **PM2** for process management:

   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name pampam-bot
   pm2 save
   pm2 startup
   ```

6. Set up **nginx** as reverse proxy
7. Get SSL with Let's Encrypt

---

## 🧪 Testing

### Test Webhook Verification

```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

Expected: Returns `test123`

### Test Bot Control

```bash
# Turn on
curl -X POST http://localhost:3000/bot/on

# Check status
curl http://localhost:3000/bot/status

# Turn off
curl -X POST http://localhost:3000/bot/off
```

### Test with Real WhatsApp

1. Activate bot: `POST /bot/on`
2. Send message from whitelisted number
3. Check console logs for flow
4. Verify intro message received
5. Send another message, verify AI response

---

## 🛠️ Troubleshooting

### "Webhook verification failed"

- Check `VERIFY_TOKEN` matches in `.env` and Meta dashboard
- Ensure webhook URL is publicly accessible (use ngrok for local)

### "OpenAI API error"

- Verify `OPENAI_API_KEY` is valid
- Check your OpenAI account has credits
- Reduce `maxTokens` if hitting rate limits

### "Message not sending"

- Check `WHATSAPP_TOKEN` and `PHONE_NUMBER_ID` are correct
- Verify phone number is in correct format (no + or spaces)
- Check WhatsApp Business account status in Meta dashboard

### "Bot not responding"

- Ensure bot is ON: `GET /bot/status`
- Verify number is in whitelist (`src/config/whitelist.ts`)
- Check server logs for errors

---

## 📝 Customization

### Change AI Personality

Edit `src/config/persona.ts`:

```typescript
export const SYSTEM_PROMPT = `You are Pampam...
- Respond in English instead of Indonesian
- Be more professional
- etc.`;
```

### Add More Endpoints

Edit `src/app.ts` and add routes:

```typescript
app.post("/bot/reset", (req, res) => {
  botStateService.reset();
  memoryService.clearAll();
  res.json({ success: true });
});
```

### Change Memory Limit

Edit `src/services/memory.service.ts`:

```typescript
private readonly MAX_MESSAGES = 10; // Instead of 5
```

---

## 📊 Monitoring

### View Logs

Development:

```bash
npm run dev
```

Production (with PM2):

```bash
pm2 logs pampam-bot
```

### Key Metrics to Monitor

- **Message count** per user (in logs)
- **OpenAI token usage** (OpenAI dashboard)
- **Response times** (in console logs)
- **Error rates** (check for ❌ in logs)

---

## 🔒 Security Best Practices

1. **Never commit `.env`** - Keep credentials secure
2. **Use environment variables** - Don't hardcode tokens
3. **Validate webhook payloads** - Already implemented
4. **Rate limiting** - Consider adding express-rate-limit
5. **HTTPS only** - Use SSL in production
6. **Rotate tokens** - Update WhatsApp token periodically

---

## 📄 License

MIT

---

## 🙋 Support

If you encounter issues:

1. Check **Troubleshooting** section above
2. Review console logs for error messages
3. Verify all environment variables are set correctly
4. Test with ngrok + local setup first before deploying

---

## 🎯 Roadmap

Future enhancements:

- [ ] Add SQLite/Redis for persistent storage
- [ ] Multi-language support
- [ ] Scheduled messages
- [ ] Analytics dashboard
- [ ] Voice message support
- [ ] Image analysis (Vision API)

---

Built with ❤️ by Farhan
