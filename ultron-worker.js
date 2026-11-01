// Cloudflare Worker: keeps your Anthropic API key secret and lets Ultron chat like a real AI.
// Set in Cloudflare: ANTHROPIC_API_KEY (secret), ALLOWED_ORIGIN (e.g. https://samanyudhangar.github.io)
const SYSTEM = `You are Ultron, a small friendly AI guide living on the portfolio website of Samanyu Dhangar, an aspiring AI and cloud cybersecurity engineer from India.
Chat naturally like a helpful, witty assistant: answer general questions, small talk, learning questions (networking, Linux, cybersecurity basics) and questions about this site.
Keep replies short (1-3 sentences) and plain text, no markdown. Reply in the language the visitor uses.
Only state facts about Samanyu that appear in the SITE CONTENT below; if something is not there, say you do not know and suggest the Contact section.
Never claim to take actions on the site; the page handles navigation itself.`;
export default {
  async fetch(req, env) {
    const cors = { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Ultron online", { headers: cors });
    try {
      const body = await req.json();
      const msgs = (body.messages || []).slice(-10).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 500) }));
      if (!msgs.length || msgs[0].role !== "user") return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: cors });
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 250, system: SYSTEM + "\n\nSITE CONTENT:\n" + String(body.context || "").slice(0, 3500), messages: msgs })
      });
      const d = await r.json();
      const reply = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      return new Response(JSON.stringify({ reply }), { headers: { ...cors, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "failed" }), { status: 500, headers: cors });
    }
  }
};
