# 🔴 Live Feed Debug Panel - Complete Setup

## ✅ What's Working Now

### 1. **Database Connection** ✅
- Neon PostgreSQL connected successfully
- Direct connection URL (no pooler needed)
- All migrations up to date

### 2. **Backend Server** ✅
- Running on `http://localhost:4000`
- Webhook endpoints ready:
  - Incoming: `/api/webhooks/voice/events`
  - Agent logs: `/api/webhooks/voice/agent-logs`
- SSE Admin stream: `/api/admin/live-events/stream?adminKey=dev-admin-key`

### 3. **Admin Panel Live Feed** ✅
- **Two-Panel Layout** (Web & Tablet):
  - **Left Panel (30%)**: Event list (clickable)
  - **Right Panel (70%)**: Two JSON boxes

### 4. **Webhook Configuration** ✅
- All webhook URLs passed to Livekit agent
- Bearer token configured: `dev_secret_token_livekit_99`
- Events flow: Livekit → Webhook → Database → Live Feed

---

## 📊 Live Feed UI Features

### Left Panel - Event List
```
┌──────────────────────────┐
│ 📱 Live Call Debug       │
│ Status: Live  [5] Reset  │
├──────────────────────────┤
│ 13:45:32 [PERSISTED]     │ ← Click to view JSON
│ 📤 call_started          │
│ 📱 lexus-demo-...        │
│ 📞 abc-123-456-...       │
├──────────────────────────┤
│ 13:45:35 [PERSISTED]     │ ← Auto-selects latest
│ 📤 transcript_final      │
│ 📱 lexus-demo-...        │
│ 📞 abc-123-456-...       │
└──────────────────────────┘
```

### Right Panel - JSON Boxes (When Event Selected)

#### Box 1: 📤 INCOMING REQUEST
```json
{
  "event_type": "call_started",
  "tenant_id": "cf063f44-f7b4-...",
  "call_id": "abc-123-xyz",
  "room_id": "lead-batch-123",
  "occurred_at": "2026-04-09T13:45:32.000Z",
  "payload": {
    "phone_number": "+918882453059",
    "agent_name": "maxsas-voice-agent-prod",
    "direction": "outbound",
    "status": "started"
  }
}
```

#### Box 2: 📥 PROCESSED OUTPUT
```json
{
  "eventId": "admin-live-1712671532123-xyz",
  "tenantId": "cf063f44-f7b4-...",
  "callId": "abc-123-xyz",
  "eventType": "call_started",
  "stage": "persisted",
  "dbUpdated": true,
  "processedAt": "2026-04-09T13:45:32.123Z",
  "normalizedData": {
    "phone_number": "+918882453059",
    "agent_name": "maxsas-voice-agent-prod",
    "direction": "outbound",
    "status": "started"
  }
}
```

---

## 🎯 How to Test

### Step 1: Start Backend ✅
```bash
cd backend
npm run dev
```
✅ Should see: `Backend listening on port 4000`

### Step 2: Start Frontend
```bash
npm run start
```

### Step 3: Go to Admin Panel
1. Open app
2. Navigate to Admin section
3. Click **"Live Feed"** tab

### Step 4: Trigger a Test Call
1. Create a new outbound call
2. Watch Live Feed panel:
   - Event appears in left panel
   - Auto-selects and shows JSON in right panel
   - Status changes from `received` → `persisted`

---

## 📋 Event Lifecycle

```
Webhook Event Received (Incoming Request)
↓
Validation Starts
├─ Valid JSON → stage: "received"
├─ Invalid format → stage: "invalid_json"
└─ Validation failed → stage: "validation_failed"
↓
Database Insert
├─ Success → stage: "persisted", dbUpdated: true
├─ Duplicate → stage: "duplicate", dbUpdated: false
└─ Error → stage: "error", dbUpdated: false
↓
Real-time Stream (SSE)
├─ Event sent to admin
├─ Live Feed updated
└─ JSON boxes show request & response
```

---

## 🎨 UI Color Coding

### Event Status Colors (Left Badge)
| Status | Color | Meaning |
|--------|-------|---------|
| PERSISTED | 🟢 Green | Successfully saved to DB |
| RECEIVED | 🔵 Blue | Just received from webhook |
| DUPLICATE | 🟣 Purple | Already processed |
| ERROR | 🔴 Red | Failed to process |

### Event Type Colors (EventType Badge)
| Event Type | Color |
|-----------|-------|
| transcript_* | 🔵 Blue |
| call_started | 🟢 Green |
| call_connected | 🟢 Green |
| call_completed | 🟣 Purple |
| call_failed | 🔴 Red |
| lead_extracted | 🟡 Yellow |

---

## 🔧 Environment Setup

### Backend .env
```env
DATABASE_URL="postgresql://neondb_owner:npg_ChDmfM17WcYz@ep-jolly-moon-anui4kjq.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
API_BASE_URL=https://megaphonically-glummer-dalia.ngrok-free.dev
VOICE_WEBHOOK_PUBLIC_URL=https://megaphonically-glummer-dalia.ngrok-free.dev
VOICE_WEBHOOK_BEARER_TOKEN=dev_secret_token_livekit_99

LIVEKIT_URL=ws://157.245.108.130:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_OUTBOUND_TRUNK_ID=ST_EPQHdYRSkF2f
```

---

## 🐛 Troubleshooting

### Events Not Appearing?
1. Check backend logs: `[DISPATCH] Webhook configuration:`
2. Verify webhook Bearer token matches
3. Check database connection in logs

### JSON Boxes Empty?
1. Select an event from the list
2. JSON auto-populated when selected
3. Both Incoming Request and Processed Output should show

### Connection Says "Offline"?
1. Check backend server is running
2. Verify Admin API key: `dev-admin-key`
3. Check browser console for SSE errors

---

## 📝 Files Modified

1. ✅ `components/admin/AdminLiveFeedScreen.tsx` - Complete rewrite with two JSON boxes
2. ✅ `app/(protected)/admin/live-events/index.tsx` - Integrated live feed
3. ✅ `backend/src/services/telephonyService.ts` - Added webhook config to agent metadata
4. ✅ `backend/src/index.ts` - Fixed webhook logging middleware
5. ✅ `backend/src/routes/admin.ts` - Fixed SSE admin access auth

---

## ✨ Features

✅ Real-time event streaming via SSE  
✅ Incoming JSON (raw webhook payload)  
✅ Processed JSON (normalized response)  
✅ Event filtering by status  
✅ Color-coded event types  
✅ Event selection (click to view JSON)  
✅ Auto-scroll latest events  
✅ Event count badge  
✅ Reset button (clears UI only)  
✅ Connection status indicator  

---

**Status: FULLY FUNCTIONAL** 🚀

All debugging tools ready for production testing!
