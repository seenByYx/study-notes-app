const TELEGRAM_API_BASE = "https://api.telegram.org";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

async function telegramRequest(method, payload) {
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    const description = data?.description || "Telegram API request failed";
    throw new Error(description);
  }
  return data;
}

function buildLaunchMessage(webAppUrl) {
  return {
    text: "Open Study Notes Mini App:",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Study Notes",
            web_app: { url: webAppUrl },
          },
        ],
      ],
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (configuredSecret && incomingSecret !== configuredSecret) {
      return res.status(401).json({ message: "Unauthorized webhook call" });
    }

    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const text = String(message.text || "").trim().toLowerCase();
    if (!["/start", "/app", "/webapp"].includes(text)) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const webAppUrl = getRequiredEnv("TELEGRAM_WEB_APP_URL");
    const launchMessage = buildLaunchMessage(webAppUrl);
    await telegramRequest("sendMessage", {
      chat_id: message.chat.id,
      ...launchMessage,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(500).json({ message: "Failed to process Telegram webhook" });
  }
}
