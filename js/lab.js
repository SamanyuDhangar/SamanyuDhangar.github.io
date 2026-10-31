/* lab.js — preserved from the original portfolio: both tools run locally, nothing is sent anywhere. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
  /* ---- password forge ---- */
  const pw = $("#pw");
  $("#pw-eye").onclick = (e) => { const s = pw.type === "password"; pw.type = s ? "text" : "password"; e.target.textContent = s ? "HIDE" : "SHOW"; };
  const COMMON = ["password", "123456", "qwerty", "letmein", "admin", "welcome", "iloveyou", "abc123"];
  pw.addEventListener("input", () => {
    const v = pw.value; if (!v) { $("#pw-bar").style.width = 0; $("#pw-v").textContent = "AWAITING INPUT"; $("#pw-e").textContent = $("#pw-t").textContent = "—"; return; }
    const pool = (/[a-z]/.test(v) * 26) + (/[A-Z]/.test(v) * 26) + (/\d/.test(v) * 10) + (/[^\w]/.test(v) * 32);
    let bits = v.length * Math.log2(pool || 1); if (COMMON.some((c) => v.toLowerCase().startsWith(c))) bits = Math.min(bits, 12);
    const sec = Math.pow(2, bits) / 1e10 / 2, u = [[31536e3, "years"], [86400, "days"], [3600, "hours"], [60, "minutes"]];
    let t = sec < 1 ? "instantly" : sec > 31536e9 ? "centuries+" : (() => { for (const [s, n] of u) if (sec >= s) return Math.round(sec / s) + " " + n; return Math.round(sec) + " seconds"; })();
    const lv = bits < 28 ? ["VERY WEAK", 12, "#e07a7a"] : bits < 40 ? ["WEAK", 35, "#d79a45"] : bits < 60 ? ["FAIR", 60, "#c9b458"] : bits < 80 ? ["STRONG", 82, "#8fd9a8"] : ["EXCELLENT", 100, "#8fd9a8"];
    Object.assign($("#pw-bar").style, { width: lv[1] + "%", background: lv[2] }); $("#pw-v").textContent = lv[0]; $("#pw-e").textContent = Math.round(bits) + " bits"; $("#pw-t").textContent = t;
  });

  /* ---- packet / HTTP header inspector: intentionally local-only ---- */
  const packetInput = $("#packet-input"), packetResult = $("#packet-result");
  const samplePacket = "GET / HTTP/1.1\nHost: example.com\nUser-Agent: browser\nAccept: */*\nConnection: close";
  $("#packet-example").addEventListener("click", () => { packetInput.value = samplePacket; analyzePacket(); });
  $("#packet-analyze").addEventListener("click", analyzePacket);
  function analyzePacket() {
    const raw = packetInput.value.trim();
    if (!raw) { packetResult.innerHTML = '<span class="dim">No input supplied. Paste a request or response first.</span>'; return; }
    const lines = raw.split(/\r?\n/), first = lines[0] || "", headers = {};
    for (const line of lines.slice(1)) { const i = line.indexOf(":"); if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim(); }
    const isRequest = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT|TRACE)\s+\S+\s+HTTP\/\d/i.test(first);
    const isResponse = /^HTTP\/\d(?:\.\d)?\s+\d{3}/i.test(first);
    const flags = [];
    if (/^HTTP\/1\.0/i.test(first)) flags.push("HTTP/1.0 is an older protocol version.");
    if (headers["server"]) flags.push("Server banner is exposed: consider whether detailed version information is necessary.");
    if (headers["x-powered-by"]) flags.push("X-Powered-By reveals application technology.");
    if (headers["authorization"]) flags.push("Authorization header detected. Avoid sharing real credentials in samples.");
    if (headers["cookie"]) flags.push("Cookie header detected. Treat session values as sensitive.");
    if (headers["set-cookie"] && !/\bsecure\b/i.test(headers["set-cookie"])) flags.push("Set-Cookie sample does not show the Secure attribute (context matters).");
    if (isRequest && !headers.host && /HTTP\/1\.[01]/i.test(first)) flags.push("Host header is missing from an HTTP/1.x request.");
    const safe = (s) => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    let out = `<div class="line"><span>STRUCTURE</span><span class="value ${isRequest || isResponse ? 'good' : 'flag'}">${isRequest ? 'HTTP REQUEST' : isResponse ? 'HTTP RESPONSE' : 'UNRECOGNIZED / RAW TEXT'}</span></div>`;
    out += `<div class="line"><span>START LINE</span><span class="value">${safe(first.slice(0, 150))}</span></div>`;
    out += `<div class="line"><span>HEADERS PARSED</span><span class="value">${Object.keys(headers).length}</span></div>`;
    out += `<div class="line"><span>HOST</span><span class="value">${safe(headers.host || 'not present')}</span></div>`;
    out += `<div class="line"><span>HTTPS INDICATOR</span><span class="value">${/https:/i.test(first) ? 'URL mentions HTTPS' : 'Cannot determine from this text alone'}</span></div>`;
    out += flags.length ? `<p class="flag" style="margin-top:.7rem">REVIEW NOTES</p><ul style="padding-left:1.2rem">${flags.map(f => `<li class="flag">${safe(f)}</li>`).join('')}</ul>` : `<p class="good" style="margin-top:.7rem">No basic review flags detected in the supplied text.</p>`;
    packetResult.innerHTML = out;
  }

})();
