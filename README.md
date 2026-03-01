# 🏢 OpenClaw Virtual Office

[📖 繁體中文說明](README.zh-TW.md)

A pixel-art virtual office dashboard that visualizes your [OpenClaw](https://github.com/openclaw/openclaw) agent sessions in real-time. Characters use **MetroCity** sprite assets with animated walking cycles, modular outfits, and hair styles.

![OpenClaw Virtual Office Screenshot](screenshot.png)

## Concept

**One Bot, Multiple Group Chats = Virtual Office Workers**

This project works with **any OpenClaw-supported channel** — Lark (Larksuite), Telegram, Discord, Slack, Signal, WhatsApp, and more. It can be used by a single person or a whole team.

- You run **1 OpenClaw Gateway** connected to your messaging platform
- Each **group chat** is a separate session — a virtual "office worker" with a specific role
- Real team members join these groups to collaborate with AI agents
- This dashboard shows all agents' status at a glance, like a virtual office floor plan

**Roadmap:** The long-term goal is to evolve into a **multi-user collaborative dashboard** with richer target information — showing not just agent status, but task details, message flow, and cross-session interactions.

### Example Setup (Lark)

```
┌─────────────────────────────────────────────────┐
│  OpenClaw Gateway (1 instance)                  │
│                                                 │
│  Lark Group: 主控室     → Session: 小機 (Admin) │
│  Lark Group: 技術部     → Session: Tech Support  │
│  Lark Group: 行政會計   → Session: Admin/Finance │
│  Lark Group: 上架工     → Session: Product Ops   │
│  Lark Group: 行銷廣告   → Session: Marketing     │
└─────────────────────────────────────────────────┘
```

Each group = one desk in the virtual office. The dashboard shows who's busy, idle, or offline.

### Other Channels

This works with **any** OpenClaw-supported channel, not just Lark:

| Channel | Multi-user + Bot? | Session Key Format | sessionMatch Example |
|---------|:-:|---|---|
| **Lark / Feishu** | ✅ | `agent:main:feishu:group:oc_xxx` | `oc_xxx` (group ID) |
| **Telegram** | ✅ | `agent:main:telegram:group:-100xxx` | `-100xxx` (group ID) |
| **Discord** | ✅ | `agent:main:discord:channel:123xxx` | `123xxx` (channel ID) |
| **Slack** | ✅ | `agent:main:slack:channel:C0xxx` | `C0xxx` (channel ID) |
| **Signal** | ✅ | `agent:main:signal:group:base64xxx` | group ID |
| **WhatsApp** | ✅ | `agent:main:whatsapp:group:xxx@g.us` | group ID |

> **Note:** This project has only been tested with **Lark (Larksuite) / Feishu**. Other channels should work with the same session-matching logic, but are untested. PRs and feedback welcome!

## Features

- 🎨 **Pixel art office** — retro RPG-style 2D top-down view with MetroCity character sprites
- 🧍 **Modular characters** — each agent has a unique look (body type, outfit, hair) composed from MetroCity sprite layers
- 📊 **Real-time status** — busy / online / idle / offline per agent
- 💬 **Activity bubbles** — floating 💬 chat indicator for busy agents
- ⌨️ **Seated work animation** — busy agents sit at their desk (back to camera), upper body animates above the desk to simulate typing
- 🚶 **Walking animation** — idle/online agents leave their desk and walk around the office with 4-directional sprite animation
- 🚧 **Collision avoidance** — walking agents avoid furniture, walls, and decorations
- 🔄 **Real-time updates** — WebSocket push with polling fallback
- ⚙️ **Configurable** — edit `config.json` to add/rename agents and assign sprite combos

## Quick Start

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) gateway running with at least one channel configured
- Node.js 18+ (for the WebSocket server)

### 1. Clone

```bash
git clone https://github.com/thx0701/openclaw-virtual-office.git
cd openclaw-virtual-office
```

### 2. Configure Agents

Edit `config.json` to match your OpenClaw sessions:

```json
{
  "title": "My Virtual Office",
  "refreshInterval": 30,
  "agents": [
    {
      "id": "main",
      "name": "Alice 🤖",
      "sprite": "agent-boss",
      "sessionMatch": "your_chat_id_or_keyword",
      "role": "Team Lead"
    }
  ]
}
```

- **`sessionMatch`**: A substring to match against OpenClaw session keys. For Lark groups, use the group chat ID (e.g., `oc_xxxx`).
- **`sprite`**: Choose from available agent sprites: `agent-boss`, `agent-tech`, `agent-admin`, `agent-listing`, `agent-marketing`. Each has 4-direction walk spritesheets.

### 3. Start the Server

```bash
node server.js
```

This starts an all-in-one server that:
- Serves the dashboard on `http://0.0.0.0:18899`
- Pushes real-time updates via WebSocket (`ws://0.0.0.0:18899/ws`)
- Polls OpenClaw sessions every 10 seconds
- Auto-detects status changes and broadcasts immediately

**Alternative: Simple static server (no WebSocket)**

```bash
python3 refresh-status.py --loop 30 &
python3 -m http.server 18899 --bind 0.0.0.0
```

## Status Logic

| Status | Condition | Visual |
|--------|-----------|--------|
| 🟠 Busy | Last activity < 2 min ago | Agent seated at desk (back to camera) + 💬 bubble + typing animation |
| 🟢 Online | Last activity 2–10 min ago | Agent walks around the office |
| 🔵 Idle | Last activity 10–60 min ago | Agent walks around the office (slower) |
| ⚫ Offline | No activity > 60 min or no session | Empty desk |

## Character Sprites

Characters are built from [MetroCity](https://arlantr.itch.io/metrocity) modular sprite layers:

| Agent Sprite | Body | Outfit | Hair | Description |
|---|---|---|---|---|
| `agent-boss` | Male, light skin | Casual shirt (Outfit 3) | Hair 1 | Gateway admin |
| `agent-tech` | Male, pale skin | Blue casual (Suit 2.0) | Hair 3 | Tech support |
| `agent-admin` | Female, light skin | Outfit 1 | Hair 2 | Admin/Finance |
| `agent-listing` | Male, dark skin | Outfit 2 | Hair 5 | Product ops |
| `agent-marketing` | Female, tan skin | Outfit 4 | Hair 4 | Marketing |

Each agent has walk animations in 4 directions (down, up, left, right) with 6 frames per direction, rendered at 2× pixel scale (64×64 per frame).

### Adding Custom Characters

You can generate new character sprites by combining different body, outfit, and hair layers from the MetroCity asset pack. See the sprite generation script in the project history for reference.

## Project Structure

```
openclaw-virtual-office/
├── index.html           # Main dashboard page
├── config.json          # Agent configuration (edit this!)
├── server.js            # WebSocket server + status poller
├── refresh-status.py    # Standalone status poller (alternative)
├── status.json          # Auto-generated status data
├── assets/office/       # Pixel art sprites
│   ├── agent-*-walk-*.png   # MetroCity character spritesheets
│   ├── agent-*-full.png     # Full 4-direction spritesheets
│   ├── desk-with-pc.png     # Workstation desk
│   ├── plant.png, coffee-maker.png, printer.png ...
│   └── (office furniture & decorations)
├── screenshot.png
└── README.md
```

## Related Projects

- [openclaw-virtual-office (mogilevtsevdmitry)](https://github.com/mogilevtsevdmitry/openclaw-virtual-office) — Phaser 3 + NestJS + PostgreSQL version with office zones
- [openclaw-office (wickedapp)](https://github.com/wickedapp/openclaw-office) — AI-generated office scenes with cyberpunk themes, Next.js dashboard
- [openclaw-world (ChenKuanSun)](https://github.com/ChenKuanSun/openclaw-world) — 3D lobster avatars in Three.js with Nostr P2P relay

## Credits

- **Office furniture pixel art**: [Free Office Pixel Art by Arlan_TR](https://arlantr.itch.io/free-office-pixel-art) — free for personal & commercial use
- **Character sprites**: [MetroCity — Free Top Down Character Pack by BK.A4](https://arlantr.itch.io/metrocity) — free asset pack for top-down games (free for personal & commercial use, credits appreciated)
- **OpenClaw**: [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
- Built with ❤️ by the OSSLab team

## License

MIT
