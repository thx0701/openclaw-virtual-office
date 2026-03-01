# 🏢 OpenClaw Virtual Office

A pixel-art virtual office dashboard that visualizes your [OpenClaw](https://github.com/openclaw/openclaw) agent sessions in real-time. Characters use **MetroCity** sprite assets with animated walking cycles, modular outfits, and hair styles.

用像素風虛擬辦公室，即時視覺化你的 OpenClaw Agent 工作狀態。角色使用 **MetroCity** 像素素材，支援走路動畫、模組化服裝與髮型。

![OpenClaw Virtual Office Screenshot](screenshot.png)

https://github.com/user-attachments/assets/demo.mp4

## Concept | 核心概念

**One Bot, Multiple Group Chats = Virtual Office Workers**
**一個 Bot + 多個群組 = 虛擬辦公室**

This project works with **any OpenClaw-supported channel** — Lark (Larksuite), Telegram, Discord, Slack, Signal, WhatsApp, and more.

本專案支援所有 OpenClaw 支援的 channel — Lark、Telegram、Discord、Slack、Signal、WhatsApp 等。

- You run **1 OpenClaw Gateway** / 你只需要 **1 個 OpenClaw Gateway**
- Each **group chat** = a virtual "office worker" / 每個群組 = 一個虛擬員工
- Real team members collaborate with AI agents / 真人團隊和 AI Agent 協作
- Dashboard shows all agents at a glance / Dashboard 一眼看到所有狀態

### Example Setup | 範例

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

### Supported Channels | 支援的 Channel

| Channel | Multi-user + Bot? | Session Key Format | sessionMatch Example |
|---------|:-:|---|---|
| **Lark / Feishu** | ✅ | `agent:main:feishu:group:oc_xxx` | `oc_xxx` |
| **Telegram** | ✅ | `agent:main:telegram:group:-100xxx` | `-100xxx` |
| **Discord** | ✅ | `agent:main:discord:channel:123xxx` | `123xxx` |
| **Slack** | ✅ | `agent:main:slack:channel:C0xxx` | `C0xxx` |
| **Signal** | ✅ | `agent:main:signal:group:base64xxx` | group ID |
| **WhatsApp** | ✅ | `agent:main:whatsapp:group:xxx@g.us` | group ID |

> **Note:** Tested with Lark (Larksuite). Other channels should work but are untested. 目前僅在 Lark 上測試過。

## Features | 功能

- 🎨 **Pixel art office** with MetroCity character sprites / 像素風辦公室 + MetroCity 角色
- 🧍 **Modular characters** — unique body, outfit, hair per agent / 模組化角色（體型、服裝、髮型）
- ⌨️ **Seated work animation** — busy agents sit at desk, upper body animates / 坐桌打字動畫
- 🚶 **Walking animation** — idle agents walk around with 4-directional sprites / 四方向走路動畫
- 🚧 **Collision avoidance** — walkers avoid furniture & decorations / 碰撞迴避
- ☕ **Rest spots** — idle agents visit coffee machine, water cooler, chairs / 休息區行為
- 💬 **Activity bubbles** — 💬 indicator for busy agents / 忙碌氣泡
- 🔄 **Real-time updates** — WebSocket push + polling fallback / 即時 WebSocket 更新
- ⚙️ **Configurable** — edit `config.json` for agents & sprites / 可自訂設定

## Quick Start | 快速開始

### Prerequisites | 前置條件

- [OpenClaw](https://github.com/openclaw/openclaw) gateway running / 已運行的 OpenClaw Gateway
- Node.js 18+

### 1. Clone

```bash
git clone https://github.com/thx0701/openclaw-virtual-office.git
cd openclaw-virtual-office
```

### 2. Configure Agents | 設定 Agent

Edit `config.json`: 編輯 `config.json`：

```json
{
  "title": "My Virtual Office",
  "agents": [
    {
      "id": "main",
      "name": "Alice 🤖",
      "sprite": "agent-boss",
      "sessionMatch": "oc_xxxx",
      "role": "Team Lead"
    }
  ]
}
```

- **`sessionMatch`**: Substring to match OpenClaw session keys (e.g., Lark group ID `oc_xxxx`) / 用來匹配 session key 的子字串
- **`sprite`**: `agent-boss`, `agent-tech`, `agent-admin`, `agent-listing`, `agent-marketing`

### 3. Start Server | 啟動

```bash
node server.js
```

Opens at `http://0.0.0.0:18899` with WebSocket real-time push.

**Alternative (no WebSocket):**

```bash
python3 refresh-status.py --loop 30 &
python3 -m http.server 18899 --bind 0.0.0.0
```

## Status Logic | 狀態邏輯

| Status | Condition | Visual |
|--------|-----------|--------|
| 🟠 Busy / 忙碌 | Activity < 2 min | Seated at desk + 💬 bubble + typing animation |
| 🟢 Online / 在線 | Activity 2–10 min | Walking around office |
| 🔵 Idle / 閒置 | Activity 10–60 min | Walking around (slower), visiting rest spots |
| ⚫ Offline / 離線 | > 60 min or no session | Empty desk |

## Character Sprites | 角色素材

Characters are composed from [MetroCity](https://arlantr.itch.io/metrocity) modular sprite layers:

角色由 MetroCity 模組化素材分層合成：

### Current Characters | 目前使用的角色

| Sprite | Body | Outfit | Hair | Role |
|---|---|---|---|---|
| `agent-boss` | Male, light skin (row 0) | Outfit 3 | Hair 1 | Admin |
| `agent-tech` | Male, pale skin (row 4) | Suit 2.0 - casual blue (row 2) | Hair 3 | Tech |
| `agent-admin` | Female, light skin (row 1) | Outfit 1 | Hair 2 | Finance |
| `agent-listing` | Male, dark skin (row 5) | Outfit 2 | Hair 5 | Product |
| `agent-marketing` | Female, tan skin (row 2) | Outfit 4 | Hair 4 | Marketing |

Each: 4 directions × 6 frames, rendered at 2× scale (64×64 per frame).

每個角色：4 方向 × 6 幀，2 倍像素渲染（64×64 每幀）。

### Available (Unused) Assets | 尚未使用的素材

The MetroCity pack includes additional assets ready for future characters:

MetroCity 素材包還有以下可用資源：

**Body Types / 體型** (Character Model.png — 768×192, 6 rows):
| Row | Description |
|-----|-------------|
| 0 | Male, light skin ✅ used |
| 1 | Female, light skin ✅ used |
| 2 | Female, tan skin ✅ used |
| 3 | **Female, dark skin** 🔲 unused |
| 4 | Male, pale skin ✅ used |
| 5 | Male, dark skin ✅ used |

**Outfits / 服裝** (Outfit1–6.png — 768×32 each):
| File | Description | Status |
|------|-------------|--------|
| Outfit1.png | Outfit 1 | ✅ used (admin) |
| Outfit2.png | Outfit 2 | ✅ used (listing) |
| Outfit3.png | Outfit 3 | ✅ used (boss) |
| Outfit4.png | Outfit 4 | ✅ used (marketing) |
| **Outfit5.png** | Outfit 5 | 🔲 unused |
| **Outfit6.png** | Outfit 6 | 🔲 unused |

**Suit 2.0 / 2.0 制服** (Suit.png — 768×128, 4 rows):
| Row | Description | Status |
|-----|-------------|--------|
| 0 | **Police uniform / 警察制服** | 🔲 unused |
| 1 | **Bellhop uniform / 門僮制服** | 🔲 unused |
| 2 | Casual blue shirt / 藍色休閒衫 | ✅ used (tech) |
| 3 | **Casual orange / 橘色 T 恤** | 🔲 unused |

**Hair Styles / 髮型** (Hairs.png — 768×256, 8 rows):
| Row | Status |
|-----|--------|
| 0 (Hair.png) | 🔲 unused |
| 1 (Hair1.png) | ✅ used (boss) |
| 2 (Hair2.png) | ✅ used (admin) |
| 3 (Hair3.png) | ✅ used (tech) |
| 4 (Hair4.png) | ✅ used (marketing) |
| 5 (Hair5.png) | ✅ used (listing) |
| 6 (Hair6.png) | 🔲 unused |
| 7 (Hair7.png) | 🔲 unused |

### Adding Custom Characters | 新增自訂角色

Combine different body, outfit, and hair layers using Python + PIL. Example:

```python
from PIL import Image

body = Image.open("CharacterModel/Character Model.png")
hairs = Image.open("Hair/Hairs.png")
outfit = Image.open("Outfits/Outfit5.png")

# Extract row (32px height each), composite, save
# See build-sprites.py in project history
```

## Project Structure

```
openclaw-virtual-office/
├── index.html           # Dashboard page
├── config.json          # Agent config (edit this!)
├── server.js            # WebSocket server + status poller
├── refresh-status.py    # Standalone poller (alternative)
├── status.json          # Auto-generated status
├── assets/office/
│   ├── agent-*-walk-*.png   # Character walk spritesheets
│   ├── agent-*-full.png     # Full 4-dir spritesheets
│   ├── desk-with-pc.png, chair.png, sink.png
│   ├── plant.png, coffee-maker.png, printer.png ...
│   └── (office furniture & decorations)
├── screenshot.png
└── README.md
```

## Related Projects

- [openclaw-virtual-office (mogilevtsevdmitry)](https://github.com/mogilevtsevdmitry/openclaw-virtual-office) — Phaser 3 + NestJS + PostgreSQL
- [openclaw-office (wickedapp)](https://github.com/wickedapp/openclaw-office) — AI-generated cyberpunk scenes, Next.js
- [openclaw-world (ChenKuanSun)](https://github.com/ChenKuanSun/openclaw-world) — 3D Three.js + Nostr P2P

## Credits | 致謝

- **Office furniture**: [Free Office Pixel Art by Arlan_TR](https://arlantr.itch.io/free-office-pixel-art) — free for personal & commercial use
- **Character sprites**: [MetroCity — Free Top Down Character Pack by BK.A4](https://arlantr.itch.io/metrocity) — free for personal & commercial use, credits appreciated / 可免費商用，建議標註出處
- **OpenClaw**: [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
- Built with ❤️ by the OSSLab team

## License

MIT
