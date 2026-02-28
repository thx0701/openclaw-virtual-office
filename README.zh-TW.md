# 🏢 OpenClaw Virtual Office

用像素風虛擬辦公室，即時視覺化你的 [OpenClaw](https://github.com/openclaw/openclaw) Agent 工作狀態。

![OpenClaw Virtual Office 截圖](screenshot.png)

## 核心概念

**一個 Bot + 多個群組 = 虛擬辦公室**

這個專案是為使用 **Lark (Larksuite) / 飛書** 搭配 OpenClaw 的團隊設計的：

- 你只需要 **1 個 OpenClaw Gateway**，連接你的通訊平台（Lark、Telegram、Discord、Slack 等）
- 每個 **群組聊天** 就是一個獨立的 session — 對應一個虛擬「辦公室員工」，負責特定職務
- 真人團隊成員加入這些群組，和 AI Agent 協作
- 這個 Dashboard 一眼看到所有 Agent 的即時狀態，就像俯瞰辦公室

### 範例：Lark 工作流

```
┌──────────────────────────────────────────────────┐
│  OpenClaw Gateway（1 個實例）                     │
│                                                  │
│  Lark 群組: 主控室      → Session: 小機（管理員）  │
│  Lark 群組: 技術部      → Session: 技術支援        │
│  Lark 群組: 行政會計    → Session: 行政會計特助     │
│  Lark 群組: 上架工      → Session: 商品上架        │
│  Lark 群組: 行銷廣告    → Session: 行銷廣告        │
└──────────────────────────────────────────────────┘
```

每個群組 = 辦公室裡的一張辦公桌。Dashboard 顯示誰在忙、誰閒置、誰離線。

### 其他 Channel 的對應方式

不只 Lark，任何 OpenClaw 支援的 channel 都能用：

| Channel | 多人+Bot 共群？ | Session Key 格式 | sessionMatch 範例 |
|---------|:-:|---|---|
| **Lark / 飛書** | ✅ | `agent:main:feishu:group:oc_xxx` | `oc_xxx`（群組 ID）|
| **Telegram** | ✅ | `agent:main:telegram:group:-100xxx` | `-100xxx`（群組 ID）|
| **Discord** | ✅ | `agent:main:discord:channel:123xxx` | `123xxx`（頻道 ID）|
| **Slack** | ✅ | `agent:main:slack:channel:C0xxx` | `C0xxx`（頻道 ID）|
| **Signal** | ✅ | `agent:main:signal:group:base64xxx` | 群組 ID |
| **WhatsApp** | ✅ | `agent:main:whatsapp:group:xxx@g.us` | 群組 ID |

所有 channel 運作方式相同：**多個真人 + 1 個 Bot 在同一個群組**。每個群組 = 1 個 OpenClaw session = 辦公室裡的一張桌子。在 `config.json` 的 `sessionMatch` 填入群組/頻道 ID 即可匹配。

## 功能

- 🎨 **像素風辦公室** — 復古 RPG 風格 2D 俯視圖
- 📊 **即時狀態** — 每個 Agent 顯示忙碌 / 在線 / 閒置 / 離線
- 💬 **活動氣泡** — 忙碌中的 Agent 頭上浮動 💬 指示
- 🚶 **走路動畫** — 閒置 Agent 在辦公室走動
- 🔄 **自動更新** — 每 30 秒抓取 `status.json` 更新畫面
- 📱 **手機可看** — 桌機和手機瀏覽器都能開
- ⚙️ **可自訂** — 編輯 `config.json` 新增/改名 Agent、指定角色圖片

## 快速開始

### 前置條件

- [OpenClaw](https://github.com/openclaw/openclaw) Gateway 已運行，且至少設定一個 channel
- Python 3.8+（用於狀態更新腳本）
- 任何 HTTP 伺服器（Python 內建的就夠）

### 1. 下載

```bash
git clone https://github.com/thx0701/openclaw-virtual-office.git
cd openclaw-virtual-office
```

### 2. 設定 Agent

編輯 `config.json`，對應你的 OpenClaw session：

```json
{
  "title": "我的虛擬辦公室",
  "refreshInterval": 30,
  "agents": [
    {
      "id": "main",
      "name": "小明 🤖",
      "sprite": "boss.png",
      "sessionMatch": "你的群組ID或關鍵字",
      "role": "組長"
    }
  ]
}
```

- **`sessionMatch`**：用來比對 OpenClaw session key 的子字串。Lark 群組用群組 ID（如 `oc_xxxx`），其他 channel 用 session key 中的任意唯一片段。
- **`sprite`**：從 `assets/office/` 資料夾選擇角色圖片（boss.png、worker1.png、worker2.png、worker4.png、desk-with-pc.png）

### 3. 啟動狀態更新

```bash
# 執行一次：
python3 refresh-status.py

# 持續執行（建議）：
python3 refresh-status.py --loop 30
```

這會呼叫 `openclaw sessions list --json` 並寫入 `status.json`。

### 4. 啟動 Web 伺服器

```bash
python3 -m http.server 18899 --bind 0.0.0.0
```

瀏覽器開啟 `http://localhost:18899` 即可看到。

### 5. （選用）背景執行

```bash
# 啟動更新程式
nohup python3 refresh-status.py --loop 30 > /tmp/office-refresh.log 2>&1 &

# 啟動網頁伺服器
nohup python3 -m http.server 18899 --bind 0.0.0.0 > /tmp/office-server.log 2>&1 &
```

## 狀態判定邏輯

| 狀態 | 條件 | 畫面呈現 |
|------|------|---------|
| 🟠 忙碌中 | 最後活動 < 2 分鐘 | Agent 坐在桌前 + 💬 氣泡 |
| 🟢 在線 | 最後活動 2–10 分鐘 | Agent 坐在桌前 |
| 🔵 閒置 | 最後活動 10–60 分鐘 | Agent 坐在桌前（較暗）|
| ⚫ 離線 | 超過 60 分鐘無活動或無 session | 空桌子 |

## 可用角色圖片

| 角色 | 檔名 | 說明 |
|------|------|------|
| Boss | `boss.png` | 深色頭髮，坐在電腦前 |
| Worker 1 | `worker1.png` | 短髮，坐在電腦前 |
| Worker 2 | `worker2.png` | 金髮，坐在電腦前 |
| Worker 4 | `worker4.png` | 藍髮，坐在電腦前 |
| 空桌 | `desk-with-pc.png` | 沒人的工作站 |
| Julia（走路）| `Julia_walk_*.png` | 走路動畫 sprite sheet |

## 專案結構

```
openclaw-virtual-office/
├── index.html           # Dashboard 主頁
├── config.json          # Agent 設定（改這個！）
├── refresh-status.py    # OpenClaw session 輪詢程式
├── status.json          # 自動產生的狀態資料
├── assets/office/       # 像素風素材
├── screenshot.png       # README 用截圖
└── README.md
```

## 致謝

- **辦公室像素素材**：[Free Office Pixel Art by Arlan_TR](https://arlantr.itch.io/free-office-pixel-art)（可免費商用）
- **OpenClaw**：[github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
- 由 OSSLab 團隊用 ❤️ 打造

## 授權

MIT
