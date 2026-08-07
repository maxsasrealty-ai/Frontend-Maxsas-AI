# Call Duration Limit — Backend Integration Guide

## Overview
Frontend now sends **call duration limit settings** in the outbound call trigger payload. Backend must:
1. **Accept and validate** the new payload structure
2. **Forward duration config** to the agent infra/voice calling service
3. **Enforce timeout** on active calls when duration limit is enabled

---

## Frontend Payload Structure

### POST `/api/calls` (Initiate Call)

```json
{
  "tenantId": "tenant-uuid",
  "roomId": "room-uuid",
  "phoneNumber": "+1234567890",
  "agentName": "Agent Name",
  "direction": "outbound",
  "voiceCalling": {
    "callDurationLimitSec": 58,
    "callDurationLimitEnabled": true
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `voiceCalling.callDurationLimitSec` | `number \| null` | Optional | Duration in seconds. Values: **58** (1 min), **118** (2 min), **178** (3 min). Send `null` if disabled. |
| `voiceCalling.callDurationLimitEnabled` | `boolean` | Optional | `true` if limit is active, `false` if disabled. When `false`, ignore `callDurationLimitSec`. |

---

## UI Behavior (Reference)

**Settings Page** (`Profile > Settings > Call Duration Limit`):

1. **Toggle Button**: "On" / "Off"  
   - When **OFF**: duration buttons are disabled (faded)
   - When **ON**: user can select a duration

2. **Duration Options**:
   - Button 1: "1 min" → sends `58` seconds
   - Button 2: "2 min" → sends `118` seconds  
   - Button 3: "3 min" → sends `178` seconds

3. **Storage**: Both `callDurationLimitSec` and `callDurationLimitEnabled` are persisted to AsyncStorage and remain consistent across app restarts.

---

## Backend Implementation Checklist

- [ ] Accept `voiceCalling` object in `InitiateCallRequest`
- [ ] Validate `callDurationLimitSec` is one of: `58`, `118`, `178`, or `null`
- [ ] Validate `callDurationLimitEnabled` is a boolean (or safely default to `false`)
- [ ] **Forward to Agent Infra**: Pass duration config to the voice calling service (LiveKit / SIP)
- [ ] **Enforce Timeout**: After `callDurationLimitSec` seconds, automatically disconnect the call if still active
- [ ] **Emit Event**: When duration limit is reached, emit a `call_duration_limit_reached` event or similar
- [ ] **Handle Edge Cases**:
  - If `callDurationLimitEnabled` is `false`, ignore `callDurationLimitSec` completely
  - If `callDurationLimitSec` is `null` and enabled is `true`, use a safe default (e.g., 58 sec)

---

## Example Request Flow

1. **User selects "2 min" in Settings** → Frontend stores `callDurationLimitSec: 118, callDurationLimitEnabled: true`
2. **User starts an outbound call** → Frontend sends POST `/api/calls` with `voiceCalling: { callDurationLimitSec: 118, callDurationLimitEnabled: true }`
3. **Backend receives request** → Validates, stores config, forwards to agent/voice service
4. **Agent/Voice Service starts call** → Monitors call duration, kills call at 118 seconds
5. **Call ends** → Backend records final duration, emits completion event

---

## Notes for Backend Dev

- **Feature Flag**: Consider whether this should be behind a feature flag initially
- **Logging**: Log when duration limit is applied; helpful for debugging timeout issues
- **Backward Compatibility**: Old requests without `voiceCalling` object should still work (treat as no limit)
- **Testing**: Test with actual 58-second call to verify timeout behavior

---

## Frontend-Backend Communication

If there are issues with the request structure or the backend needs adjustments:
1. Check the browser Network tab (DevTools) to see exact payload being sent
2. Backend logs should show the full request body
3. If 400 Bad Request persists, verify field names and types match exactly
4. Use same snake_case or camelCase consistently

**Frontend sends in camelCase**: `callDurationLimitSec`, `callDurationLimitEnabled`  
(Convert to your backend's convention if needed, e.g., `call_duration_limit_sec`)
