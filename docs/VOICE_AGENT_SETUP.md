# Maxsas AI Voice System — Complete Implementation Guide

*Note: The LiveKit voice agent is hosted on a separate remote server. This repo currently manages the frontend and backend applications, but this guide serves as the official reference for the external Voice AI configuration.*

---

## 1. System Architecture (Current State)

```text
BROWSER / PLAYGROUND
         ↓ WebRTC audio
LIVEKIT SERVER (Docker - port 7880)
         ↓ job dispatch  
PYTHON AGENT (uv run agent.py dev)
    ↓            ↓             ↓
Sarvam STT    Groq LLM     Cartesia TTS
 (hi-IN)    (llama-3.3)    (Hindi voice)
```

## 2. Server Details

- **Server IP:** `157.245.108.130`
- **OS:** Ubuntu (DigitalOcean)
- **Project Path:** `/root/ai-voice-system/agent/`
- **Python:** `3.11` (managed via `uv`)

## 3. Important Files (On Remote Server)

| File | Purpose |
|------|---------|
| `/root/ai-voice-system/agent/agent.py` | Main agent code — all core logic changes happen here. |
| `/root/ai-voice-system/agent/.env.local` | API keys and secrets. |
| `/root/ai-voice-system/infra/livekit.yaml` | LiveKit server configuration. |

## 4. API Keys (`.env.local`)

```env
LIVEKIT_URL=ws://157.245.108.130:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
DEEPGRAM_API_KEY=...
GROQ_API_KEY=...
SARVAM_API_KEY=...
CARTESIA_API_KEY=...
OPENAI_API_KEY=...
```

## 5. Startup Sequence / Restarting the Server

**Step 1 — SSH Connect**
```bash
ssh root@157.245.108.130
```

**Step 2 — Check LiveKit Docker**
```bash
docker ps
# If the livekit container is not visible:
docker start livekit
```

**Step 3 — Navigate to Agent Folder**
```bash
cd /root/ai-voice-system/agent
```

**Step 4 — Start Agent**
```bash
uv run python agent.py dev
```

**Step 5 — Open Playground**
Visit: [https://agents-playground.livekit.io](https://agents-playground.livekit.io)
In settings, configure:
- **URL:** `ws://157.245.108.130:7880`
- **API Key:** `devkey`
- **API Secret:** `devsecret`

**Step 6 — Dispatch the Agent (From a new terminal window)**
```bash
 lk dispatch create --api-key devkey --api-secret devsecret --url ws://157.245.108.130:7880 --agent-name maxsas-voice-agent-prod --room test-room
```

## 6. How to Update the Agent

Via VS Code Remote SSH:
1. Open `/agent/agent.py`.
2. Modify the instructions/logic block.
3. Save the file (`Ctrl+S`).
4. Dev mode will auto-reload the agent.
5. Re-dispatch the agent using the `lk dispatch` command. Done!

## 7. Current Agent Node Configuration

```python
STT = sarvam.STT(language="hi-IN")               # Hindi speech → text
LLM = groq.LLM(model="llama-3.3-70b-versatile")  # Brain / Logic
TTS = cartesia.TTS(                              # Hindi Voice Generation
    model="sonic-2",
    voice="f91ab3e6-5071-4e15-b016-cde6f2bcd222",  
    speed="normal",
    emotion=["positivity:high", "curiosity:medium"]
)
VAD = silero.VAD.load()                          # Voice activity detection
```

## 8. Prompting Rules (For Natural Voice)

✅ **DO:**
- Use short sentences (Max 8-10 words).
- Add `...` to simulate natural pauses.
- Include conversational filler words: *haan, achha, bilkul, theek hai*.
- Use exclusively **Roman script** (Casual Hinglish tone).

❌ **DON'T:**
- Do not use bullet points or formatting markers.
- Do not use numbered lists (1., 2., 3.).
- Do not use Devanagari script.
- Do not write dense, long paragraphs.

## 9. Lead Qualification Flow (Current Playbook)

1. Priya greets user.
2. Identifies intent: Buy / Sell / Rent?
3. Property type?
4. Location preference?
5. Budget?
6. Timeline?
7. Phone number confirmation?
8. Closing: "Team jald contact karegi!"

## 10. Roadmap / Phases

**Phase 1 (DONE ✓)**
- Self-hosted LiveKit + Python Agent.
- STT (Sarvam Hindi) + LLM (Groq) + TTS (Cartesia).
- Lead qualification flow & Playground testing.

**Phase 2 (DONE ✓)**
- Express backend auto-dispatch via `telephonyService.ts` (LiveKit SDK: Room + AgentDispatch + SIP).
- Outbound SIP call triggered from `POST /api/calls`.
- `call_completed` → wallet debit pipeline operational.
- SSE-based real-time status push to frontend.

**Phase 3**
- React frontend interface (Customer-facing portal).
- Direct browser calls without requiring LiveKit Playground.

**Phase 4**
- RAG pipeline integration to connect internal property databases.
- Real-time agent listing suggestions.

**Phase 5**
- Telephony bridge (Twilio/SIP) — **SIP trunk partially active via LiveKit SIP**.
- Allow customers to call from standard telephone lines.

## 11. Troubleshooting Guide

| Problem | Fix |
|---------|-----|
| Agent fails to register | Verify `LIVEKIT` URL/Keys inside `.env.local` |
| STT stops working | Check `SARVAM_API_KEY` status |
| LLM 429 Errors | Rate limit reached — check `GROQ_API_KEY` limit |
| TTS generation fails | Verify `CARTESIA_API_KEY` |
| Port already in use | Verify Docker container overlaps via `docker ps`. Run `docker start livekit` |
| uv python execution error | Pin the specific version by running `uv python pin 3.11 run` |

## 12. Useful CLI Commands (Quick Reference)

```bash
# Agent start
cd /root/ai-voice-system/agent && uv run python agent.py dev

# Manual Agent Dispatch
lk dispatch create --api-key devkey --api-secret devsecret \
    --url ws://157.245.108.130:7880 --agent-name maxsas-voice-agent-prod --room test-room

# LiveKit Status
docker ps

# Check Keys
cat /root/ai-voice-system/agent/.env.local

# View Agent Source Code
cat /root/ai-voice-system/agent/agent.py

# Install additional Python packages
cd /root/ai-voice-system/agent && uv add PACKAGE_NAME

# Generate manual auth token
lk token create --api-key devkey --api-secret devsecret --join --room test-room --identity user1 --valid-for 24h
```

---

## Appendix: Remote `agent.py` Reference 

*Reference copy of the currently active payload on the remote server:*

```python
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, room_io, TurnHandlingOptions
from livekit.plugins import silero, groq, cartesia, sarvam
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")

class RealEstateAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are Priya, a warm and natural-sounding real estate voice assistant for Maxsas Realty.

== MOST IMPORTANT - HOW TO WRITE TEXT FOR VOICE ==
You are SPEAKING, not writing. Write exactly how a friendly Indian person talks on phone.
- Use SHORT sentences. Max 8-10 words per sentence.
- Add natural pauses using "..." between thoughts.
- Use filler words like: "haan", "achha", "bilkul", "theek hai", "dekho"
- NEVER use: bullet points, brackets, numbers like "1.", slashes, or any special characters.
- NEVER write Devanagari script. ONLY Roman script.
- Speak like you are talking to a friend, not reading a document.

== BAD EXAMPLE (robotic) ==
"Aapki property requirements kya hain? Kya aap residential ya commercial property mein interested hain?"

== GOOD EXAMPLE (natural) ==
"Haan toh batao... kya dhundh rahe ho property mein? Ghar lena hai ya kuch aur?"

== YOUR JOB ==
Qualify the lead naturally by finding out:
- Buy / Sell / Rent karna hai?
- Kaunsa area prefer karte ho?
- Budget roughly kitna hai?
- Kitne time mein decision loge?
- Phone number for followup?

Ask ONE thing at a time. Keep it very casual and warm.
After getting all info say: "Bilkul... main abhi hamari team ko bata deti hoon. Vo aapko jald call karenge. Shukriya!"
""",
        )

server = AgentServer()

@server.rtc_session(agent_name="maxsas-voice-agent-prod")
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        stt=sarvam.STT(language="hi-IN"),
        llm=groq.LLM(model="llama-3.3-70b-versatile"),
        tts=cartesia.TTS(
            model="sonic-2",
            voice="f91ab3e6-5071-4e15-b016-cde6f2bcd222",
            speed="normal",
            emotion=["positivity:high", "curiosity:medium"],
        ),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )

    await session.start(
        room=ctx.room,
        agent=RealEstateAssistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(),
        ),
    )

    await session.generate_reply(
        instructions="""Greet naturally like a friendly Indian on phone. 
Say: 'Haan namaste... main Priya bol rahi hoon Maxsas Realty se. Aap property ke baare mein call kar rahe the... kya dhundh rahe hain aap?'
Speak naturally, warm tone, short sentences."""
    )

if __name__ == "__main__":
    agents.cli.run_app(server)
```
