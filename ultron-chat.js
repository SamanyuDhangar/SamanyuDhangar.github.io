/* ULTRON CHAT 2.0 — a bigger, smarter chat box.
   Works fully offline (no API key needed): message bubbles, typing indicator, saved history,
   slash commands, quick-reply buttons, and a toolbox (calculator, hashes, encoders, subnet
   calculator, port lookup, Linux/Git explainer, security glossary, password generator, ...).
   If ULTRON_API is set (see ULTRON_SETUP.md) anything Ultron can't answer still goes to the AI. */
(() => {
  "use strict";
  const C = window.UltronCore;
  if (!C) return;
  const $ = (s, p = document) => p.querySelector(s), $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const pad = (n) => String(n).padStart(2, "0");
  const clock = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const secName = (id) => { const c = C.CH.find((x) => x[0] === id); return c ? c[2] : "THRESHOLD"; };

  /* ============================== KNOWLEDGE ============================== */
  const COMMANDS = {
    ls: ["Lists files and folders.", "ls -la   (long format, includes hidden files)"],
    cd: ["Changes the current directory.", "cd /var/log"],
    pwd: ["Prints the directory you are in.", "pwd"],
    cat: ["Prints a file's contents.", "cat /etc/os-release"],
    less: ["Lets you scroll through long files or output.", "less /var/log/syslog"],
    head: ["Shows the first lines of a file.", "head -n 20 file.txt"],
    tail: ["Shows the last lines of a file. -f follows it live.", "tail -f /var/log/auth.log"],
    grep: ["Searches text for a pattern.", "grep -ri \"failed\" /var/log"],
    find: ["Finds files by name, type, size or time.", "find / -name \"*.conf\" 2>/dev/null"],
    chmod: ["Changes file permissions (r=4, w=2, x=1 for owner / group / others).", "chmod 640 notes.txt   (owner rw, group r, others none)"],
    chown: ["Changes a file's owner and group.", "sudo chown user:group file"],
    sudo: ["Runs one command with administrator (root) rights.", "sudo apt update"],
    ps: ["Lists running processes.", "ps aux"],
    top: ["Live view of processes and resource use.", "top"],
    kill: ["Sends a signal to a process. -9 is the forceful last resort.", "kill 1234"],
    ssh: ["Opens an encrypted remote shell on another machine.", "ssh user@host"],
    scp: ["Copies files over SSH.", "scp file.txt user@host:/tmp/"],
    curl: ["Makes web requests from the terminal.", "curl -I https://example.com   (headers only)"],
    wget: ["Downloads files from the web.", "wget https://example.com/file.zip"],
    ping: ["Tests reachability and round-trip time using ICMP.", "ping -c 4 8.8.8.8"],
    traceroute: ["Shows the hops a packet takes to a destination.", "traceroute example.com"],
    ip: ["Shows and configures network interfaces and routes.", "ip a   |   ip route"],
    ss: ["Lists sockets: which ports are open or in use.", "ss -tulpn"],
    netstat: ["Older tool for connections and listening ports (ss replaces it).", "netstat -tulpn"],
    nmap: ["Scans hosts for open ports and services. Only scan systems you own or have permission to test.", "nmap -sV 192.168.1.1"],
    tcpdump: ["Captures packets in the terminal (the command-line cousin of Wireshark).", "sudo tcpdump -i eth0 port 53"],
    dig: ["Queries DNS records.", "dig example.com A"],
    nslookup: ["Simple DNS lookup.", "nslookup example.com"],
    df: ["Shows free disk space.", "df -h"],
    du: ["Shows how much space files use.", "du -sh *"],
    tar: ["Bundles and compresses files.", "tar -czf backup.tar.gz folder/"],
    man: ["Opens the manual page for a command.", "man chmod"],
    history: ["Lists previous commands.", "history | grep ssh"],
    echo: ["Prints text or variable values.", "echo $PATH"],
    awk: ["Processes text column by column.", "awk '{print $1}' access.log"],
    sed: ["Finds and replaces text in streams or files.", "sed 's/old/new/g' file.txt"],
    systemctl: ["Starts, stops and inspects services.", "systemctl status ssh"],
    journalctl: ["Reads the system logs.", "journalctl -u ssh -n 50"],
    ufw: ["Simple firewall front-end on Ubuntu.", "sudo ufw allow 22/tcp"],
    iptables: ["Low-level Linux firewall rules.", "sudo iptables -L -n"],
    uname: ["Shows kernel and system information.", "uname -a"],
    whoami: ["Prints your current username.", "whoami"],
    id: ["Shows your user and group IDs.", "id"],
    passwd: ["Changes a user's password.", "passwd"],
    cp: ["Copies files.", "cp a.txt b.txt"],
    mv: ["Moves or renames files.", "mv old.txt new.txt"],
    rm: ["Deletes files. There is no recycle bin, so double-check before -r.", "rm -r old_folder"],
    mkdir: ["Creates a directory.", "mkdir -p projects/lab1"],
    touch: ["Creates an empty file or updates its timestamp.", "touch notes.txt"],
    ln: ["Creates links (shortcuts) to files.", "ln -s /path/target link"],
    wc: ["Counts lines, words and bytes.", "wc -l file.txt"],
    sort: ["Sorts lines.", "sort -n numbers.txt"],
    uniq: ["Removes or counts adjacent duplicate lines.", "sort file | uniq -c"],
    cut: ["Extracts columns from text.", "cut -d: -f1 /etc/passwd"],
    xargs: ["Builds commands from piped input.", "find . -name \"*.log\" | xargs rm"],
    which: ["Shows where a command lives.", "which python3"],
    diff: ["Compares two files.", "diff a.txt b.txt"],
    env: ["Prints environment variables.", "env"],
    gcc: ["The GNU C compiler.", "gcc main.c -o main -Wall"],
    make: ["Builds projects from a Makefile.", "make"]
  };
  const GIT = {
    init: ["Starts a new repository in the current folder.", "git init"],
    clone: ["Copies a remote repository to your machine.", "git clone https://github.com/user/repo.git"],
    status: ["Shows changed, staged and untracked files.", "git status"],
    add: ["Stages changes for the next commit.", "git add file.c   |   git add ."],
    commit: ["Saves the staged changes as a snapshot with a message.", "git commit -m \"Fix buffer check\""],
    push: ["Uploads your commits to the remote.", "git push origin main"],
    pull: ["Fetches and merges remote changes.", "git pull"],
    fetch: ["Downloads remote changes without merging them.", "git fetch origin"],
    branch: ["Lists, creates or deletes branches.", "git branch feature-x"],
    checkout: ["Switches branches or restores files (newer: git switch / git restore).", "git checkout feature-x"],
    switch: ["Switches to another branch.", "git switch main"],
    merge: ["Combines another branch into the current one.", "git merge feature-x"],
    rebase: ["Replays your commits on top of another base for a linear history.", "git rebase main"],
    log: ["Shows commit history.", "git log --oneline --graph"],
    diff: ["Shows what changed.", "git diff   |   git diff --staged"],
    stash: ["Puts uncommitted work aside temporarily.", "git stash   |   git stash pop"],
    reset: ["Moves the branch pointer back; --hard also discards changes. Use with care.", "git reset --soft HEAD~1"],
    restore: ["Discards changes in a file or unstages it.", "git restore file.c"],
    remote: ["Manages the remotes your repo talks to.", "git remote -v"],
    tag: ["Marks a commit, e.g. a release.", "git tag v1.0"]
  };
  const GLOSS = {
    "tcp": "Transmission Control Protocol: reliable, ordered delivery. It opens a connection with a three-way handshake (SYN, SYN-ACK, ACK).",
    "udp": "User Datagram Protocol: fast and connectionless, with no delivery guarantee. Used by DNS queries, streaming and games.",
    "three-way handshake|handshake": "How TCP opens a connection: the client sends SYN, the server answers SYN-ACK, the client replies ACK.",
    "ip|ip address": "Internet Protocol address: the logical address of a device on a network. IPv4 has 32 bits (192.168.1.10), IPv6 has 128.",
    "dns": "Domain Name System: translates names such as example.com into IP addresses. Usually UDP/TCP port 53.",
    "dhcp": "Dynamic Host Configuration Protocol: automatically gives devices an IP address, mask, gateway and DNS server.",
    "nat": "Network Address Translation: lets many private addresses share one public IP by rewriting addresses and ports at the router.",
    "arp": "Address Resolution Protocol: maps an IP address to a MAC address on the local network. ARP spoofing abuses this.",
    "icmp": "Internet Control Message Protocol: error and diagnostic messages. Ping and traceroute use it.",
    "mac address|mac": "A hardware address (like 3C:52:82:AA:10:F4) used to deliver frames on the local network segment.",
    "subnet|subnetting": "A smaller network carved out of a bigger one using a mask. Try: subnet 192.168.1.10/26",
    "gateway|default gateway": "The router a device sends traffic to when the destination is outside its own subnet.",
    "router": "Forwards packets between networks using IP addresses and routing tables.",
    "switch": "Forwards frames inside a network using MAC addresses.",
    "http": "HyperText Transfer Protocol: how browsers and servers exchange web content. Plain HTTP is unencrypted (port 80).",
    "https": "HTTP over TLS: encrypted and authenticated web traffic (port 443).",
    "tls|ssl": "Transport Layer Security (successor to SSL): encrypts data in transit and lets you verify the server's identity with certificates.",
    "vpn": "Virtual Private Network: an encrypted tunnel between your device and another network.",
    "firewall": "Filters network traffic with rules (allow or deny by address, port or protocol).",
    "ids|ips|ids/ips": "Intrusion Detection / Prevention System: watches traffic for attack patterns. An IDS alerts; an IPS can also block.",
    "siem": "Security Information and Event Management: collects and correlates logs from many systems so analysts can spot incidents.",
    "osi|osi model": "Seven layers of networking:\n- 7 Application\n- 6 Presentation\n- 5 Session\n- 4 Transport (TCP/UDP)\n- 3 Network (IP)\n- 2 Data link (MAC)\n- 1 Physical",
    "packet": "A unit of data sent over a network: a header (addresses, protocol info) plus a payload.",
    "wireshark": "A packet analyser that captures traffic and shows it protocol by protocol, great for learning how networks really behave.",
    "port": "A number (0-65535) that identifies a service on a host. Try: port 443",
    "phishing": "Tricking people into giving up credentials or running malware, usually with fake emails, messages or sites. Check the sender, the link target and the urgency.",
    "malware": "Malicious software: viruses, worms, trojans, spyware, ransomware and more.",
    "ransomware": "Malware that encrypts files and demands payment. Offline backups are the best defence.",
    "ddos|dos": "(Distributed) Denial of Service: flooding a target with traffic or requests so legitimate users cannot reach it.",
    "mitm|man in the middle|man-in-the-middle": "Man-in-the-middle: an attacker secretly relays or alters traffic between two parties. TLS and certificate checks defend against it.",
    "sql injection|sqli": "Attack that slips SQL into an input field so the database runs it. Prevent it with parameterised queries.",
    "xss|cross site scripting|cross-site scripting": "Cross-site scripting: injecting script into a page other users view. Prevent it with output encoding and a content security policy.",
    "csrf": "Cross-site request forgery: tricks a logged-in user's browser into sending an unwanted request. Anti-CSRF tokens and SameSite cookies help.",
    "2fa|mfa|two factor|two-factor|multi factor|multi-factor": "Using more than one proof of identity (password plus an app code or security key). It blocks most stolen-password attacks.",
    "encryption": "Scrambling data with a key so only authorised parties can read it. Symmetric uses one shared key (AES); asymmetric uses a key pair (RSA, ECC).",
    "hashing|hash": "A one-way function that turns data into a fixed-size fingerprint (SHA-256). Same input, same hash. Try: sha256 hello",
    "salt": "Random data added to a password before hashing so identical passwords give different hashes and rainbow tables fail.",
    "zero day|zero-day|0day": "A vulnerability that is exploited before the vendor has a fix.",
    "cve": "Common Vulnerabilities and Exposures: public IDs (like CVE-2021-44228) for known security flaws.",
    "osint": "Open-source intelligence: gathering information from public sources.",
    "social engineering": "Manipulating people instead of systems: pretexting, phishing, tailgating and so on.",
    "vulnerability": "A weakness that could be exploited. An exploit is the method that uses it; a threat is who or what might do so; risk is likelihood times impact.",
    "exploit": "Code or a technique that takes advantage of a vulnerability.",
    "sandbox": "An isolated environment for running untrusted code safely.",
    "threat model|threat modeling|threat modelling": "Thinking through what you protect, who might attack, how, and what to do about it.",
    "least privilege|principle of least privilege": "Give users and programs only the access they need and nothing more.",
    "cia triad|cia": "Confidentiality, Integrity, Availability: the three core goals of information security.",
    "authentication": "Proving who you are (password, key, biometrics). Authorisation is what you are then allowed to do.",
    "authorization|authorisation": "Deciding what an authenticated identity may do.",
    "incident response|ir": "The process of handling a security incident: prepare, detect, contain, eradicate, recover, learn.",
    "linux": "A free, open-source operating system kernel; distributions such as Ubuntu, Debian and Kali build on it. Servers, cloud and security tools lean on it heavily.",
    "kernel": "The core of an operating system: manages memory, processes, devices and hardware access.",
    "shell|bash": "A program that reads commands and runs them. Bash is the most common on Linux.",
    "root": "The all-powerful administrator account on Unix-like systems.",
    "permissions|file permissions": "Linux file access is set for owner, group and others as read (4), write (2), execute (1). 755 = rwxr-xr-x, 640 = rw-r-----.",
    "git": "A distributed version-control system: it records snapshots of your project so you can branch, merge and go back in time.",
    "pointer": "In C, a variable that stores a memory address. int *p = &x; makes p point to x.",
    "malloc": "C function that reserves a block of heap memory at run time. Every malloc needs a matching free.",
    "free": "C function that releases memory obtained with malloc. Forgetting it leaks memory; using it afterwards is a use-after-free bug.",
    "buffer overflow": "Writing past the end of a buffer, corrupting nearby memory. A classic C bug and a classic attack. Check bounds and prefer safe functions.",
    "segfault|segmentation fault": "A crash caused by touching memory the program is not allowed to access, often a bad pointer.",
    "struct": "In C, a type that groups related variables under one name.",
    "cloud": "Renting computing, storage and services over the internet (AWS, Azure, GCP) instead of running your own hardware.",
    "ai security": "Protecting AI systems and using AI for defence: prompt injection, data poisoning, model theft and misuse are some of the risks."
  };
  const GLOSS_MAP = {}; Object.keys(GLOSS).forEach((k) => k.split("|").forEach((a) => { GLOSS_MAP[a] = [k.split("|")[0], GLOSS[k]]; }));
  const PORTS = {
    20: ["FTP data", "unencrypted"], 21: ["FTP", "unencrypted; prefer SFTP"], 22: ["SSH / SFTP", "encrypted remote access"], 23: ["Telnet", "unencrypted; avoid"],
    25: ["SMTP", "mail server to server"], 53: ["DNS", "UDP and TCP"], 67: ["DHCP server", "UDP"], 68: ["DHCP client", "UDP"], 69: ["TFTP", "unauthenticated"],
    80: ["HTTP", "unencrypted web"], 110: ["POP3", "mail retrieval, unencrypted"], 123: ["NTP", "time sync, UDP"], 137: ["NetBIOS", "Windows legacy"], 139: ["NetBIOS session", "Windows legacy"],
    143: ["IMAP", "mail retrieval"], 161: ["SNMP", "device monitoring; protect community strings"], 389: ["LDAP", "directory services"], 443: ["HTTPS", "encrypted web (TLS)"],
    445: ["SMB", "Windows file sharing; never expose to the internet"], 465: ["SMTPS", "mail submission over TLS"], 514: ["Syslog", "log forwarding, UDP"], 587: ["SMTP submission", "mail clients, STARTTLS"],
    636: ["LDAPS", "LDAP over TLS"], 993: ["IMAPS", "IMAP over TLS"], 995: ["POP3S", "POP3 over TLS"], 1433: ["Microsoft SQL Server", "database"], 1521: ["Oracle DB", "database"],
    3306: ["MySQL / MariaDB", "database"], 3389: ["RDP", "Windows remote desktop; frequent attack target"], 5432: ["PostgreSQL", "database"], 5900: ["VNC", "remote desktop"],
    6379: ["Redis", "should never be public"], 8080: ["HTTP alternate", "dev servers and proxies"], 8443: ["HTTPS alternate", "alternate TLS web"], 27017: ["MongoDB", "database"]
  };
  const PORT_NAMES = {}; Object.entries(PORTS).forEach(([p, v]) => v[0].toLowerCase().split(/[\s/]+/).forEach((w) => { if (w.length > 1 && !PORT_NAMES[w]) PORT_NAMES[w] = +p; }));

  /* ============================== TOOLS ============================== */
  function calc(src) {            // safe maths parser (no eval)
    const tk = src.toLowerCase().replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, "").match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+|[-+*/^%()]/g);
    if (!tk) throw 0; let i = 0;
    const F = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil };
    const K = { pi: Math.PI, e: Math.E };
    const peek = () => tk[i], nxt = () => tk[i++];
    function expr() { let v = term(); while (peek() === "+" || peek() === "-") v = nxt() === "+" ? v + term() : v - term(); return v; }
    function term() { let v = pow(); while (peek() === "*" || peek() === "/" || peek() === "%") { const o = nxt(), r = pow(); v = o === "*" ? v * r : o === "/" ? v / r : v % r; } return v; }
    function pow() { const b = unary(); if (peek() === "^") { nxt(); return Math.pow(b, pow()); } return b; }
    function unary() { if (peek() === "-") { nxt(); return -unary(); } if (peek() === "+") { nxt(); return unary(); } return atom(); }
    function atom() {
      const t = nxt(); if (t === undefined) throw 0;
      if (t === "(") { const v = expr(); if (nxt() !== ")") throw 0; return v; }
      if (/^[\d.]/.test(t)) return parseFloat(t);
      if (K[t] !== undefined) return K[t];
      if (F[t]) { if (nxt() !== "(") throw 0; const v = expr(); if (nxt() !== ")") throw 0; return F[t](v); }
      throw 0;
    }
    const v = expr(); if (i < tk.length || !isFinite(v)) throw 0; return v;
  }
  const fmtNum = (n) => Number.isInteger(n) ? String(n) : String(+n.toPrecision(12));

  const hex = (buf) => [...new Uint8Array(buf)].map((b) => pad(b.toString(16)).slice(-2)).join("");
  async function digest(alg, text) { return hex(await crypto.subtle.digest(alg, new TextEncoder().encode(text))); }
  const utf8b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
  const b64utf8 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  const CODECS = {
    base64: { enc: utf8b64, dec: b64utf8 }, b64: { enc: utf8b64, dec: b64utf8 },
    hex: { enc: (s) => [...new TextEncoder().encode(s)].map((b) => pad(b.toString(16))).join(" "), dec: (s) => new TextDecoder().decode(Uint8Array.from(s.replace(/0x|\s/g, "").match(/../g) || [], (h) => parseInt(h, 16))) },
    url: { enc: encodeURIComponent, dec: decodeURIComponent },
    binary: { enc: (s) => [...new TextEncoder().encode(s)].map((b) => b.toString(2).padStart(8, "0")).join(" "), dec: (s) => new TextDecoder().decode(Uint8Array.from(s.trim().split(/\s+/), (b) => parseInt(b, 2))) },
    rot13: { enc: (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)), dec: null }
  };
  CODECS.rot13.dec = CODECS.rot13.enc;

  const ip2n = (s) => { const p = s.split("."); if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255)) return null; return ((+p[0] << 24) | (+p[1] << 16) | (+p[2] << 8) | +p[3]) >>> 0; };
  const n2ip = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  function subnet(ipStr, bits) {
    const ip = ip2n(ipStr); if (ip === null || bits < 0 || bits > 32) return null;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0, net = (ip & mask) >>> 0, bc = (net | ~mask) >>> 0, total = Math.pow(2, 32 - bits);
    const usable = bits >= 31 ? total : total - 2, first = bits >= 31 ? net : net + 1, last = bits >= 31 ? bc : bc - 1;
    const kind = ((ip >>> 24) === 10 || ((ip >>> 20) === 0xac1) || ((ip >>> 16) === 0xc0a8)) ? "private (RFC 1918)" : (ip >>> 24) === 127 ? "loopback" : (ip >>> 16) === 0xa9fe ? "link-local (APIPA)" : (ip >>> 28) === 14 ? "multicast" : "public";
    return `**${ipStr}/${bits}**\n- Network: ${n2ip(net)}\n- Broadcast: ${n2ip(bc)}\n- Mask: ${n2ip(mask)} (wildcard ${n2ip(~mask >>> 0)})\n- Hosts: ${n2ip(first)} to ${n2ip(last)}\n- Usable addresses: ${usable.toLocaleString()} of ${total.toLocaleString()}\n- Address type: ${kind}`;
  }
  const BASES = { bin: 2, binary: 2, oct: 8, octal: 8, dec: 10, decimal: 10, hex: 16, hexadecimal: 16 };
  const baseName = { 2: "binary", 8: "octal", 10: "decimal", 16: "hex" };
  const prefix = { 2: "0b", 8: "0o", 10: "", 16: "0x" };
  function randInt(max) { const a = new Uint32Array(1); const lim = Math.floor(4294967296 / max) * max; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % max; }
  function makePassword(len) {
    const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*-_=+?"], all = sets.join("");
    const out = sets.map((s) => s[randInt(s.length)]);
    while (out.length < len) out.push(all[randInt(all.length)]);
    for (let i = out.length - 1; i > 0; i--) { const j = randInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
    return out.join("");
  }

  /* site-derived lists, so answers always match the page */
  const txt = (n, sel) => { const e = sel ? $(sel, n) : n; return e ? e.textContent.trim().replace(/\s+/g, " ") : ""; };
  function siteList(kind) {
    if (kind === "skills") return { id: "skills", text: "**Skills on this portfolio**\n" + $$("#skills .skill-card").map((c) => `- **${txt(c, "h3")}**: ${txt(c, "p")}`).join("\n") };
    if (kind === "projects") return { id: "projects", text: "**Projects**\n" + $$("#projects .project-card").map((c) => `- **${txt(c, "h3")}**: ${txt(c, "p")}`).join("\n") };
    if (kind === "journey") return { id: "journey", text: "**Journey so far**\n" + $$("#timeline .timeline-item").map((c) => `- **${txt(c, "h3")}** (${txt(c, ".timeline-date")}): ${txt(c, "p")}`).join("\n") };
    return { id: "certifications", text: "**Credentials**\n" + $$("#certifications .credential-item").map((c) => `- **${txt(c, "h3")}**: ${txt(c, ".credential-status") || "listed"}`).join("\n") };
  }

  /* ============================== UI ============================== */
  const M = C.M;
  M.classList.add("uc");
  M.innerHTML = `
    <div class="uc-head">
      <span class="uc-dot" aria-hidden="true"></span>
      <div class="uc-title"><b>ULTRON // CHAT</b><small class="uc-where">online</small></div>
      <div class="uc-tools">
        <button type="button" class="uc-ib" data-a="voice" title="Voice on/off" aria-label="Toggle Ultron voice">♪</button>
        <button type="button" class="uc-ib" data-a="export" title="Save chat as a text file" aria-label="Save chat">⇩</button>
        <button type="button" class="uc-ib" data-a="clear" title="Clear chat" aria-label="Clear chat">⌫</button>
        <button type="button" class="uc-ib" data-a="size" title="Bigger / smaller" aria-label="Resize chat">⤢</button>
        <button type="button" class="uc-ib" data-a="close" title="Close" aria-label="Close chat">✕</button>
      </div>
    </div>
    <div class="uc-chips">${[["tour", "▶ Tour"], ["map", "Map"], ["prev", "◀ Prev"], ["next", "Next ▶"], ["top", "Top"], ["theme", "Theme"], ["sound", "Sound"], ["voice", "Voice"]].map((c) => `<button type="button" data-c="${c[0]}">${c[1]}</button>`).join("")}</div>
    <div class="uc-log" role="log" aria-live="polite"></div>
    <div class="uc-suggest"></div>
    <div class="uc-cmdlist" role="listbox"></div>
    <form class="uc-form" autocomplete="off">
      <button type="button" class="uc-ib uc-mic" title="Speak" aria-label="Speak to Ultron" hidden>🎤</button>
      <input type="text" class="uc-input" placeholder="Ask, or type / for commands…" aria-label="Chat with Ultron" maxlength="500" enterkeyhint="send">
      <button type="submit" class="uc-send" aria-label="Send">➤</button>
    </form>`;
  const log = $(".uc-log", M), input = $(".uc-input", M), form = $(".uc-form", M), sugg = $(".uc-suggest", M), cmdlist = $(".uc-cmdlist", M), where = $(".uc-where", M);

  const KEY = "ultron-chat-v2";
  let history = []; try { history = JSON.parse(C.store.get(KEY) || "[]").slice(-40); } catch (e) { history = []; }
  const save = () => C.store.set(KEY, JSON.stringify(history.slice(-40)));

  function inline(host, s) {
    s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).forEach((part) => {
      if (!part) return;
      if (part[0] === "`" && part.length > 2) host.appendChild(el("code", "", part.slice(1, -1)));
      else if (part.startsWith("**") && part.length > 4) host.appendChild(el("strong", "", part.slice(2, -2)));
      else host.appendChild(document.createTextNode(part));
    });
  }
  function codeBlock(t) {
    const w = el("div", "uc-code"), pre = el("pre"), b = el("button", "uc-copy", "COPY"); b.type = "button";
    pre.textContent = t; b.addEventListener("click", () => copy(t, b));
    w.append(pre, b); return w;
  }
  function render(text, host) {
    let list = null, code = null;
    text.split("\n").forEach((line) => {
      if (line.startsWith("```")) { if (code) { host.appendChild(codeBlock(code.join("\n"))); code = null; } else code = []; return; }
      if (code) { code.push(line); return; }
      const m = line.match(/^\s*[-•]\s+(.*)/);
      if (m) { if (!list) { list = el("ul"); host.appendChild(list); } const li = el("li"); inline(li, m[1]); list.appendChild(li); return; }
      list = null;
      if (!line.trim()) { host.appendChild(el("div", "uc-gap")); return; }
      const p = el("div"); inline(p, line); host.appendChild(p);
    });
    if (code) host.appendChild(codeBlock(code.join("\n")));
  }
  function copy(t, btn) {
    const done = () => { if (btn) { const o = btn.textContent; btn.textContent = "COPIED"; setTimeout(() => { btn.textContent = o; }, 1200); } };
    try { navigator.clipboard.writeText(t).then(done, done); } catch (e) { done(); }
  }
  const scroll = () => { log.scrollTop = log.scrollHeight; };

  function actionButtons(actions) {
    const w = el("div", "uc-actions");
    actions.forEach((a) => {
      const b = el(a.href ? "a" : "button", "uc-act", a.label);
      if (a.href) { b.href = a.href; if (/^https?:/.test(a.href)) { b.target = "_blank"; b.rel = "noopener"; } } else b.type = "button";
      b.addEventListener("click", () => {
        if (a.go) C.travel(a.go); else if (a.send) send(a.send); else if (a.copy) copy(a.copy, b); else if (a.run) a.run();
      });
      w.appendChild(b);
    });
    return w;
  }
  function bubble(text, who, opts = {}) {
    const m = el("div", "uc-msg " + (who === "me" ? "me" : "bot"));
    const body = el("div", "uc-body"); render(text, body); m.appendChild(body);
    if (opts.actions && opts.actions.length) m.appendChild(actionButtons(opts.actions));
    m.appendChild(el("span", "uc-time", opts.time || clock()));
    log.appendChild(m); scroll();
    return m;
  }
  function thinking() { const d = el("div", "uc-msg bot uc-typing"); d.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(d); scroll(); return d; }

  function add(t, who) {                            // called by maze.js for every message
    if (who === "think") return thinking();
    const w = who === "me" ? "me" : "bot";
    bubble(t, w); history.push({ t, w, at: Date.now() }); save(); refreshSuggest();
    return log.lastChild;
  }
  function addBot(t, opts) { const m = bubble(t, "bot", opts); history.push({ t, w: "bot", at: Date.now() }); save(); refreshSuggest(); return m; }

  /* restore saved conversation */
  history.forEach((h) => bubble(h.t, h.w, { time: clock(new Date(h.at)) }));

  /* ---------- suggestions ---------- */
  const SUGGEST = {
    home: ["help", "summary", "what is a subnet"], about: ["who is Samanyu", "list skills", "what is osint"],
    mission: ["what is ai security", "summary", "what is zero day"], skills: ["list skills", "explain grep", "what is tcp"],
    journey: ["list journey", "what is wireshark", "explain nmap"], projects: ["list projects", "what is phishing", "sha256 hello"],
    certifications: ["list credentials", "what is the osi model", "port 443"], shell: ["explain chmod", "subnet 192.168.1.10/24", "generate password"],
    contact: ["contact", "base64 encode hello", "help"]
  };
  const POOL = ["calc 24*60*60", "port 22", "explain ls", "git commit", "what is dns", "convert 255 to binary", "sha256 ultron", "tell me a joke", "what is mfa", "unix now", "flip a coin"];
  function refreshSuggest() {
    const base = (SUGGEST[C.getSection()] || SUGGEST.home).slice(), extra = pick(POOL);
    const list = base.concat(base.includes(extra) ? [] : [extra]).slice(0, 4);
    sugg.textContent = "";
    list.forEach((s) => { const b = el("button", "", s); b.type = "button"; b.addEventListener("click", () => send(s)); sugg.appendChild(b); });
    where.textContent = "in: " + secName(C.getSection()).toLowerCase();
  }

  /* ---------- slash-command autocomplete ---------- */
  const SLASH = [["/help", "what I can do"], ["/summary", "overview of this site"], ["/skills", "list skills"], ["/projects", "list projects"], ["/journey", "list journey"], ["/credentials", "list credentials"], ["/contact", "contact links"],
    ["/where", "current section"], ["/goto ", "jump to a section"], ["/tour", "guided tour"], ["/map", "road map"], ["/theme", "change theme"], ["/sound", "sound on/off"], ["/voice", "voice on/off"],
    ["/clear", "clear this chat"], ["/export", "save chat as .txt"], ["/calc ", "calculator"], ["/sha256 ", "hash text"], ["/base64 ", "encode / decode"], ["/subnet ", "CIDR calculator"], ["/port ", "port lookup"],
    ["/explain ", "Linux / Git command"], ["/define ", "security glossary"], ["/password", "generate a password"], ["/unix ", "timestamp"]];
  let cmdIdx = -1;
  function showCmds() {
    const v = input.value; cmdlist.textContent = ""; cmdIdx = -1;
    if (!v.startsWith("/") || v.includes(" ") && !SLASH.some((c) => c[0] === v)) { cmdlist.classList.remove("open"); return; }
    const m = SLASH.filter((c) => c[0].startsWith(v.toLowerCase())).slice(0, 7);
    if (!m.length) { cmdlist.classList.remove("open"); return; }
    m.forEach((c) => { const b = el("button", "", ""); b.type = "button"; b.append(el("b", "", c[0].trim()), el("span", "", c[1])); b.addEventListener("click", () => { input.value = c[0]; input.focus(); if (!c[0].endsWith(" ")) send(input.value); else showCmds(); }); cmdlist.appendChild(b); });
    cmdlist.classList.add("open");
  }

  /* ---------- sending ---------- */
  const sent = []; let sentIdx = 0, busy = false;
  async function send(q) {
    q = (q || "").trim(); if (!q || busy) return;
    busy = true; sent.push(q); sentIdx = sent.length; input.value = ""; cmdlist.classList.remove("open");
    try { await C.ask(q); } finally { busy = false; }
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
  input.addEventListener("input", showCmds);
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Tab" && cmdlist.classList.contains("open")) { e.preventDefault(); const b = $$("button", cmdlist)[Math.max(0, cmdIdx)]; if (b) b.click(); return; }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const opts = $$("button", cmdlist);
      if (cmdlist.classList.contains("open") && opts.length) { e.preventDefault(); cmdIdx = (cmdIdx + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length; opts.forEach((o, i) => o.classList.toggle("sel", i === cmdIdx)); return; }
      if (!sent.length) return; e.preventDefault();
      sentIdx = Math.max(0, Math.min(sent.length, sentIdx + (e.key === "ArrowUp" ? -1 : 1))); input.value = sent[sentIdx] || ""; return;
    }
    if (e.key === "Escape") { cmdlist.classList.remove("open"); }
  });
  $(".uc-head", M).addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (!a) return;
    const k = a.dataset.a;
    if (k === "close") M.classList.remove("open");
    else if (k === "size") { M.classList.toggle("big"); scroll(); }
    else if (k === "clear") clearChat();
    else if (k === "export") exportChat();
    else if (k === "voice") { C.act("voice"); }
  });
  function clearChat() { history = []; save(); log.textContent = ""; addBot("Chat cleared. Type `help` to see what I can do.", { actions: [{ label: "help", send: "help" }] }); }
  function exportChat() {
    const lines = history.map((h) => `[${new Date(h.at).toLocaleString()}] ${h.w === "me" ? "You" : "Ultron"}: ${h.t}`).join("\n\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines || "(empty chat)"], { type: "text/plain" })); a.download = "ultron-chat.txt";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- microphone (if the browser has speech recognition) ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $(".uc-mic", M);
  if (SR) {
    mic.hidden = false; let rec = null;
    mic.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; mic.classList.add("live");
      rec.onresult = (e) => { input.value = [...e.results].map((r) => r[0].transcript).join(""); if (e.results[e.results.length - 1].isFinal) { rec.stop(); send(input.value); } };
      rec.onend = () => { rec = null; mic.classList.remove("live"); };
      rec.onerror = () => { rec = null; mic.classList.remove("live"); };
      try { rec.start(); } catch (e) { rec = null; mic.classList.remove("live"); }
    });
  }

  /* ============================== BRAIN ============================== */
  const goBtn = (id) => ({ label: "Open " + secName(id).toLowerCase(), go: id });
  const reply = (text, extra = {}) => ({ text, ...extra });
  const HELP = [
    "**What I can do**",
    "- **This site**: `summary`, `list skills`, `list projects`, `list journey`, `contact`, `where am I`",
    "- **Learn**: `what is dns`, `explain chmod`, `git rebase`, `port 443`, `what is the osi model`",
    "- **Networking**: `subnet 192.168.1.10/24`, `port 22`",
    "- **Security tools**: `sha256 hello`, `base64 encode hi`, `generate password 20`",
    "- **Utilities**: `calc 2^10 + 5`, `convert 255 to binary`, `unix now`, `flip a coin`",
    "- **Move around**: `go to projects`, `tour`, `next`, `prev`, `theme`",
    "Type `/` to see every command. Use ↑ to repeat your last message."
  ].join("\n");

  async function tools(q) {
    const raw = q.trim(); let t = raw.toLowerCase().replace(/[?!.]+$/, "").trim(); let m;
    if (t.startsWith("/")) t = t.slice(1).trim();
    const sl = raw.startsWith("/");

    /* chat control */
    if (/^(help|commands|what can you do|what can u do)$/.test(t)) return reply(HELP, { speak: "Here is what I can do. Ask about this site, learn security and Linux, or use my tools.", actions: [{ label: "summary", send: "summary" }, { label: "subnet", send: "subnet 192.168.1.10/24" }, { label: "tour", run: () => C.act("tour") }] });
    if (t === "clear" || t === "clear chat" || t === "reset chat") { clearChat(); return { handled: true }; }
    if (t === "export" || t === "export chat" || t === "save chat") { exportChat(); return reply("Saved the chat as ultron-chat.txt.", { speak: "Chat saved." }); }
    if ((m = t.match(/^goto\s+(.+)$/))) { const id = Object.keys(C.KB).find((k) => k === m[1] || C.KB[k].some((w) => m[1].includes(w))) || C.CH.map((c) => c[0]).find((k) => k.startsWith(m[1])); if (id) return reply("Heading to " + secName(id) + ".", { speak: "Heading to " + secName(id), after: () => setTimeout(() => C.travel(id), 900) }); return reply("I don't know that chamber. Try: about, mission, skills, journey, projects, certifications, shell or contact."); }
    if (/^(where am i|where are we|current section|what section)$/.test(t)) { const id = C.getSection() || "home"; return reply(`You are in **${secName(id)}**.`, { speak: "You are in " + secName(id), actions: [{ label: "◀ Prev", run: () => C.act("prev") }, { label: "Next ▶", run: () => C.act("next") }] }); }
    if (/^(summary|summarize|summarise|overview|tl;?dr|site map|about this site|what is this site|what is this website)$/.test(t)) {
      return reply("**This portfolio at a glance**\n" + C.CH.slice(1).map((c) => `- **${c[2]}**: ${c[3]}`).join("\n"), { speak: "This is Samanyu's portfolio. Pick a chamber and I will take you there.", actions: ["about", "skills", "projects", "journey", "contact"].map(goBtn) });
    }
    if (/^(contact|contact info|how (can|do) i (contact|reach)( him| samanyu)?|reach (him|samanyu)|hire (him|samanyu)|email|socials|links)$/.test(t)) {
      const links = $$("a", C.chan).map((a) => ({ label: a.firstChild.textContent.replace(/↗/, "").trim(), href: a.href }));
      return reply("You can reach Samanyu through these channels:", { speak: "Here are the ways to reach Samanyu.", actions: links });
    }
    if ((m = t.match(/^(?:list |show |what are |what is |tell me about )?(?:me )?(?:all )?(?:samanyu'?s |his |your |the |my )?(skills|projects|journey|certificates?|certifications?|credentials?)(?: list)?$/)) && !/\b(go|take|open|scroll)\b/.test(t)) {
      const kind = /^cert|^cred/.test(m[1]) ? "credentials" : m[1]; const r = siteList(kind);
      return reply(r.text, { speak: "Here is the list. I can take you there.", actions: [goBtn(r.id)] });
    }

    /* calculator */
    if ((m = t.match(/^(?:calc(?:ulate)?|math|=|what is|what's|whats|compute|solve)?\s*([\d(.+\-][\d\s+\-*/^%().,a-z×÷]*)$/)) && /\d/.test(m[1]) && (/^(calc|math|=|compute|solve)/.test(t) || /[-+*/^%×÷]/.test(m[1].replace(/^\s*[-+]/, "")) || /\b(sqrt|sin|cos|tan|log|ln|abs|round|floor|ceil)\b/.test(m[1]))) {
      try { const v = calc(m[1]); return reply(`**${m[1].trim()} = ${fmtNum(v)}**`, { speak: "That equals " + fmtNum(v), actions: [{ label: "Copy", copy: fmtNum(v) }] }); } catch (e) { if (sl || /^(calc|math|compute|solve)/.test(t)) return reply("I couldn't parse that expression. Try: `calc (12+8)*3^2`"); }
    }

    /* hashes */
    if ((m = raw.replace(/^\//, "").match(/^(?:(sha-?1|sha-?256|sha-?512)|hash)\s+(?:of\s+)?([\s\S]+)$/i))) {
      const alg = m[1] ? "SHA-" + m[1].replace(/\D/g, "") : "SHA-256", h = await digest(alg, m[2]);
      return reply(`**${alg}** of "${m[2].length > 40 ? m[2].slice(0, 40) + "…" : m[2]}"\n\`\`\`\n${h}\n\`\`\`\nComputed locally in your browser; nothing leaves this page.`, { speak: alg + " hash computed.", actions: [{ label: "Copy hash", copy: h }] });
    }

    /* number bases */
    if ((m = t.match(/^(?:convert\s+)?(?:(bin|binary|oct|octal|dec|decimal|hex|hexadecimal)\s+)?(0x[0-9a-f]+|0b[01]+|[0-9a-f]+)\s*(?:in|to|into|->|as)\s*(bin|binary|oct|octal|dec|decimal|hex|hexadecimal)$/)) && !(m[2].match(/[a-f]/) && !m[1] && !m[2].startsWith("0x"))) {
      let from = m[1] ? BASES[m[1]] : m[2].startsWith("0x") ? 16 : m[2].startsWith("0b") ? 2 : 10, s = m[2].replace(/^0[xb]/, "");
      const n = parseInt(s, from), to = BASES[m[3]];
      if (!Number.isNaN(n) && new RegExp("^[" + "0123456789abcdef".slice(0, from) + "]+$").test(s)) return reply(`**${m[2]}** (${baseName[from]}) = **${prefix[to]}${n.toString(to).toUpperCase()}** (${baseName[to]})`, { speak: "Converted." });
    }

    /* encoders */
    if ((m = raw.replace(/^\//, "").match(/^(base64|b64|hex|url|binary|rot13)\s+(encode|decode|enc|dec)?\s*([\s\S]+)$/i))) {
      const name = m[1].toLowerCase(), mode = /^dec/i.test(m[2] || "") ? "dec" : "enc";
      try { const out = CODECS[name][mode](m[3]); return reply(`**${name} ${mode === "enc" ? "encode" : "decode"}**\n\`\`\`\n${out}\n\`\`\``, { speak: "Done.", actions: [{ label: "Copy", copy: out }] }); }
      catch (e) { return reply("That doesn't look like valid " + name + " data to decode."); }
    }

    /* subnet */
    if ((m = t.match(/^(?:subnet|cidr|netmask|network|ipcalc)?\s*(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/)) || (m = t.match(/^(?:subnet|cidr|netmask|ipcalc)\s+(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,3}(?:\.\d{1,3}){3})$/))) {
      let bits = +m[2]; if (m[2].includes(".")) { const mk = ip2n(m[2]); if (mk === null) return reply("That mask isn't valid."); bits = (mk >>> 0).toString(2).replace(/0+$/, "").length; }
      const r = subnet(m[1], bits); if (r) return reply(r, { speak: "Subnet calculated.", actions: [{ label: "Copy network", copy: r.match(/Network: ([\d.]+)/)[1] }] });
      return reply("That address or prefix isn't valid. Example: `subnet 192.168.1.10/24`");
    }
    if ((m = t.match(/^(?:subnet|cidr|mask)\s*\/?(\d{1,2})$/)) && +m[1] <= 32) {
      const bits = +m[1], mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
      return reply(`**/${bits}**\n- Mask: ${n2ip(mask)}\n- Addresses: ${Math.pow(2, 32 - bits).toLocaleString()} (${bits >= 31 ? Math.pow(2, 32 - bits) : Math.pow(2, 32 - bits) - 2} usable hosts)`, { speak: "Done." });
    }

    /* ports */
    if ((m = t.match(/^(?:what(?:'s| is)?\s+)?(?:the\s+)?port\s*(?:number\s*)?(\d{1,5}|[a-z0-9]+)(?:\s+used for)?$/)) || (m = t.match(/^(\d{1,5})\/(?:tcp|udp)$/))) {
      const n = /^\d+$/.test(m[1]) ? +m[1] : PORT_NAMES[m[1]];
      if (n && PORTS[n]) return reply(`**Port ${n}**: ${PORTS[n][0]}\n- ${PORTS[n][1]}`, { speak: `Port ${n} is ${PORTS[n][0]}.` });
      if (n) return reply(`**Port ${n}**: not in my common-ports list. Ports 0-1023 are well-known, 1024-49151 are registered, and 49152+ are dynamic.`);
    }

    /* Linux / git / C explainers */
    if ((m = t.match(/^(?:explain|man|what does|what is|what's|how (?:do i|to) use|usage of|linux|cmd|command)?\s*(git\s+)?([a-z0-9]+)(?:\s+(?:do|mean|command))?$/)) && (m[1] ? GIT[m[2]] : (COMMANDS[m[2]] && (t !== m[2] || m[2].length > 2 || /^(ls|cd|cp|mv|rm|ln|id|ss|ip|wc)$/.test(m[2])) && !(GLOSS_MAP[m[2]] && !/^(explain|man|what does|how|usage|linux|cmd|command)/.test(t))))) {
      const d = m[1] ? GIT[m[2]] : COMMANDS[m[2]];
      return reply(`**${m[1] ? "git " : ""}${m[2]}**: ${d[0]}\n\`\`\`\n${d[1]}\n\`\`\``, { speak: `${m[1] ? "git " : ""}${m[2]}: ${d[0]}`, actions: [{ label: "Copy example", copy: d[1].split(/\s{2,}|\s+\|\s+/)[0] }] });
    }

    /* glossary */
    if ((m = t.match(/^(?:what(?:'s| is| are)|define|explain|meaning of|tell me about|who is|what does)\s+(?:an?\s+|the\s+)?(.+?)(?:\s+mean|\s+stand for)?$/)) || (m = [null, t])) {
      const key = m[1].replace(/\s+/g, " ").trim(), g = GLOSS_MAP[key];
      if (g && !/^(skills|projects)$/.test(key)) {
        const extra = [];
        if (key === "port") extra.push({ label: "port 443", send: "port 443" });
        if (key === "subnet" || key === "subnetting") extra.push({ label: "try a subnet", send: "subnet 192.168.1.10/26" });
        if (["hashing", "hash"].includes(key)) extra.push({ label: "sha256 hello", send: "sha256 hello" });
        if (["linux", "git", "wireshark", "cloud", "ai security"].includes(key)) extra.push(goBtn("skills"));
        return reply(`**${g[0].toUpperCase()}**: ${g[1]}`, { speak: g[1].split("\n")[0], actions: extra });
      }
    }

    /* generators and misc */
    if ((m = t.match(/^(?:generate |make |create |new |give me )?(?:a |an )?(?:strong |random |secure )?(password|passphrase|uuid)(?: of)?(?:\s+(\d{1,2}))?(?:\s+(?:chars|characters|long))?$/)) && (/^(generate|make|create|new|give|\/)/.test(t) || sl || m[2] || /strong|random|secure/.test(t))) {
      if (m[1] === "uuid") { const u = crypto.randomUUID ? crypto.randomUUID() : "unavailable"; return reply("```\n" + u + "\n```", { speak: "UUID generated.", actions: [{ label: "Copy", copy: u }] }); }
      const len = Math.max(8, Math.min(64, +m[2] || 16)), p = makePassword(len);
      return reply(`**Random password (${len} chars)**\n\`\`\`\n${p}\n\`\`\`\nGenerated locally with your browser's secure random source and not stored. Use a password manager.`, { speak: "Password generated. It stays on this device.", actions: [{ label: "Copy", copy: p }, { label: "New one", send: "generate password " + len }] });
    }
    if ((m = t.match(/^(?:unix|epoch|timestamp)(?:\s+(now|\d{9,13}))?$/))) {
      let n = m[1] && m[1] !== "now" ? +m[1] : Date.now(); if (m[1] && m[1] !== "now" && m[1].length <= 10) n *= 1000;
      const d = new Date(n);
      return reply(`**Unix time**\n- Seconds: ${Math.floor(n / 1000)}\n- UTC: ${d.toISOString()}\n- Local: ${d.toLocaleString()}`, { speak: "Done." });
    }
    if (/^(flip a coin|coin flip|toss a coin|heads or tails)$/.test(t)) { const r = randInt(2) ? "Heads" : "Tails"; return reply(`**${r}.**`, { speak: r }); }
    if ((m = t.match(/^(?:roll|throw)\s*(?:a |an )?(?:d(\d+)|dice|die)$/))) { const n = +m[1] || 6, r = 1 + randInt(Math.max(2, Math.min(1000, n))); return reply(`🎲 d${n}: **${r}**`, { speak: "You rolled " + r }); }
    if ((m = t.match(/^random\s+(\d+)\s+(?:to\s+)?(\d+)$/))) { const a = Math.min(+m[1], +m[2]), b = Math.max(+m[1], +m[2]); const r = a + randInt(b - a + 1); return reply(`**${r}** (between ${a} and ${b})`, { speak: String(r) }); }
    if (/^(osi|osi model|layers)$/.test(t)) return reply(GLOSS["osi|osi model"].replace(/^/, "**OSI MODEL**: "));
    return null;
  }

  window.UltronBrain = {
    async handle(q) {
      const t0 = Date.now(), typing = thinking();
      let r = null;
      try { r = await tools(q); } catch (e) { r = null; }
      if (r) await sleep(Math.max(0, 320 - (Date.now() - t0)));
      typing.remove();
      if (!r) return false;
      if (r.handled) return true;
      addBot(r.text, { actions: r.actions });
      if (r.speak) { C.say(r.speak, 6500); C.speak(r.speak); }
      if (r.after) r.after();
      return true;
    }
  };

  /* ---------- hand the UI to maze.js ---------- */
  window.UltronUI = {
    add, addBot,
    needsGreeting: () => history.length === 0,
    greet(name) {
      const n = name ? ", " + name : "";
      addBot(`Hello${n}. I'm **Ultron**, the guide of this site. I know this portfolio, and I carry a small toolbox:\n- learn networking, Linux, Git and security terms\n- subnet calculator, hashes, encoders, password generator\n- jump to any section\nType \`help\` or \`/\` to see everything.`, { actions: [{ label: "help", send: "help" }, { label: "summary", send: "summary" }, { label: "▶ tour", run: () => C.act("tour") }] });
      C.say("Chat open. Ask me anything.", 5000);
    },
    focus() { refreshSuggest(); setTimeout(() => input.focus(), 60); scroll(); },
    toggle() { M.classList.toggle("open"); }
  };
  refreshSuggest(); scroll();
  addEventListener("keydown", (e) => { if (e.key === "Escape" && M.classList.contains("open")) M.classList.remove("open"); });
})();
