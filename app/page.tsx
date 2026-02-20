"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Utility helpers ───────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomIP() {
  return `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
}
function randomHex(len: number) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
function randomMAC() {
  return Array.from({ length: 6 }, () => randomHex(2)).join(":");
}
function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ─── Data generators ───────────────────────────────────────────────
const PORTS = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 993, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 27017];
const SERVICES = ["FTP", "SSH", "Telnet", "SMTP", "DNS", "HTTP", "POP3", "RPC", "NetBIOS", "HTTPS", "SMB", "IMAPS", "MSSQL", "Oracle", "MySQL", "RDP", "PostgreSQL", "VNC", "Redis", "HTTP-Proxy", "HTTPS-Alt", "Elasticsearch", "MongoDB"];
const VULNS = [
  "CVE-2024-21762 // FortiOS Out-of-Bound Write",
  "CVE-2024-3400 // PAN-OS Command Injection",
  "CVE-2023-44228 // Log4Shell Remote Code Execution",
  "CVE-2024-1709 // ScreenConnect Auth Bypass",
  "CVE-2023-46805 // Ivanti Connect Secure Auth Bypass",
  "CVE-2024-27198 // JetBrains TeamCity Auth Bypass",
  "CVE-2023-4966 // Citrix Bleed Information Disclosure",
  "CVE-2024-0012 // PAN-OS Management Auth Bypass",
  "CVE-2023-22515 // Atlassian Confluence Priv Escalation",
  "CVE-2024-38077 // Windows RRAS Remote Code Execution",
];
const EXPLOITS = [
  "Deploying polymorphic shellcode...",
  "Injecting into kernel memory space...",
  "Bypassing ASLR via info leak...",
  "Escalating privileges via dirty pipe...",
  "Establishing reverse shell on port 4444...",
  "Extracting NTLM hashes from SAM database...",
  "Dumping LSASS process memory...",
  "Deploying fileless malware payload...",
  "Bypassing EDR via syscall hooking...",
  "Establishing C2 channel via DNS tunneling...",
  "Hijacking TLS session via MITM...",
  "Exploiting race condition in auth handler...",
  "Injecting malicious DLL via AppInit_DLLs...",
  "Triggering use-after-free in heap allocator...",
  "Pivoting to internal network segment...",
  "Extracting credentials from browser storage...",
  "Decrypting Kerberos TGT tickets...",
  "Overwriting SEH chain for code execution...",
  "Deploying rootkit via signed driver exploit...",
  "Exfiltrating data via covert ICMP channel...",
];
const FILE_PATHS = [
  "/etc/shadow", "/etc/passwd", "/var/log/auth.log", "/root/.ssh/id_rsa",
  "/proc/self/maps", "/sys/kernel/security/", "/var/lib/mysql/",
  "C:\\Windows\\System32\\config\\SAM", "C:\\Users\\Admin\\Desktop\\secrets.xlsx",
  "/home/admin/.bash_history", "/opt/tomcat/conf/server.xml",
  "/var/www/html/wp-config.php", "/etc/nginx/nginx.conf",
];
const PROTOCOLS = ["TCP", "UDP", "ICMP", "TLS", "SSH", "DNS", "HTTP"];
const OS_LIST = ["Windows Server 2022", "Ubuntu 22.04", "CentOS 8", "Debian 12", "FreeBSD 14", "macOS Ventura", "Red Hat 9.3", "Kali Linux 2024.1"];
const HASHES = () => randomHex(64);
const ENCRYPTION_ALGOS = ["AES-256-GCM", "ChaCha20-Poly1305", "RSA-4096", "Ed25519", "Blowfish-CBC", "Camellia-256"];

// ─── Matrix Rain ───────────────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF{}[]<>/\\|;:=+-*&^%$#@!";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () =>
      Math.random() * -100
    );

    function draw() {
      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = "#00ff41";
      ctx!.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0) {
          ctx!.globalAlpha = Math.random() * 0.5 + 0.5;
          ctx!.fillText(char, x, y);
          ctx!.globalAlpha = 1;
        }

        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 45);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-bg" />;
}

// ─── Fullscreen Entry Screen ───────────────────────────────────────
function EntryScreen({ onEnter }: { onEnter: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [glitchText, setGlitchText] = useState("ENTER SHADOW_NET");

  useEffect(() => {
    if (!hovered) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコ0123456789!@#$%";
    const original = "ENTER SHADOW_NET";
    let iteration = 0;
    const interval = setInterval(() => {
      setGlitchText(
        original
          .split("")
          .map((char, i) => {
            if (i < iteration) return original[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      iteration += 1 / 2;
      if (iteration >= original.length) {
        clearInterval(interval);
        setGlitchText(original);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [hovered]);

  const handleClick = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(onEnter).catch(onEnter);
    } else {
      onEnter();
    }
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Courier New', monospace",
      cursor: "default",
      position: "relative",
    }}>
      <MatrixRain />
      <div style={{ zIndex: 10, textAlign: "center" }}>
        <pre className="glow" style={{ fontSize: 18, marginBottom: 10, lineHeight: 1.2, userSelect: "none" }}>
{`
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
 ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
 ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║
 ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
 ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
`}
        </pre>
        <div className="glow-cyan" style={{ fontSize: 12, marginBottom: 50, letterSpacing: 6, userSelect: "none" }}>
          AUTONOMOUS PENETRATION FRAMEWORK
        </div>

        <button
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setGlitchText("ENTER SHADOW_NET"); }}
          style={{
            background: hovered ? "rgba(0, 255, 65, 0.15)" : "transparent",
            border: `2px solid ${hovered ? "#00ff41" : "#004400"}`,
            color: "#00ff41",
            fontFamily: "'Courier New', monospace",
            fontSize: 18,
            fontWeight: "bold",
            padding: "16px 48px",
            cursor: "pointer",
            letterSpacing: 4,
            textShadow: hovered ? "0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41" : "0 0 5px #00ff41",
            boxShadow: hovered ? "0 0 20px rgba(0,255,65,0.3), inset 0 0 20px rgba(0,255,65,0.1)" : "0 0 10px rgba(0,255,65,0.1)",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span style={{ position: "relative", zIndex: 1 }}>[ {glitchText} ]</span>
        </button>

        <div style={{ marginTop: 30, fontSize: 10, color: "#003300", letterSpacing: 2, userSelect: "none" }}>
          FULLSCREEN MODE REQUIRED FOR OPERATIONAL SECURITY
        </div>

        <div className="pulse" style={{ marginTop: 60, fontSize: 11, color: "#006600", letterSpacing: 1 }}>
          WARNING: UNAUTHORIZED ACCESS WILL BE TRACED AND PROSECUTED
        </div>
      </div>
    </div>
  );
}

// ─── Boot Sequence ─────────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const boot = [
      "SHADOW_NET KERNEL v4.2.1 INITIALIZING...",
      "",
      `[${timestamp()}] Loading exploit modules............... [OK]`,
      `[${timestamp()}] Initializing TOR relay chain.......... [OK]`,
      `[${timestamp()}] Connecting to C2 infrastructure....... [OK]`,
      `[${timestamp()}] Loading vulnerability database........ [OK]`,
      `[${timestamp()}] Calibrating packet injection engine... [OK]`,
      `[${timestamp()}] Spoofing MAC/IP identifiers........... [OK]`,
      `[${timestamp()}] Establishing encrypted channels....... [OK]`,
      `[${timestamp()}] Deploying network sniffers............ [OK]`,
      `[${timestamp()}] Initializing hash cracker (GPU x8).... [OK]`,
      `[${timestamp()}] Loading zero-day exploit cache........ [OK]`,
      "",
      `System ready. Welcome, gh0st_r00t.`,
      "",
      ">>> INITIATING AUTONOMOUS ATTACK SEQUENCE <<<",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < boot.length) {
        const line = boot[i];
        i++;
        setBootLines((prev) => [...prev, line]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBootDone(true);
          setTimeout(onComplete, 1000);
        }, 600);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      background: "#000",
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Courier New', monospace",
      padding: 40,
      position: "relative",
    }}>
      <MatrixRain />
      <div style={{ zIndex: 10, maxWidth: 700, width: "100%" }}>
        <pre className="glow" style={{ fontSize: 14, marginBottom: 30, textAlign: "center", userSelect: "none" }}>
{`
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
 ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
 ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║
 ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
 ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
                  N E T W O R K
`}
        </pre>
        <div style={{ fontSize: 12, lineHeight: 1.8 }}>
          {bootLines.map((line, i) => (
            <div key={i} className={line.includes("[OK]") ? "glow" : line.includes(">>>") ? "glow-red warning-flash" : line.includes("Welcome") ? "glow-cyan" : ""}>
              {line}
            </div>
          ))}
          {!bootDone && <span className="cursor-blink">█</span>}
        </div>
        {bootDone && (
          <div className="glow-red" style={{ textAlign: "center", marginTop: 20, fontSize: 14, fontWeight: "bold", letterSpacing: 4 }}>
            ENTERING SHADOW MODE...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Terminal Panel ────────────────────────────────────────────────
function TerminalPanel() {
  const [lines, setLines] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  const targetRef = useRef(randomIP());

  const generateLine = useCallback(() => {
    const phase = phaseRef.current;
    let line = "";

    if (phase < 8) {
      const scanLines = [
        `root@shadow:~# nmap -sV -sC -O -A ${targetRef.current}`,
        `Starting Nmap 7.94SVN ( https://nmap.org )`,
        `Scanning ${targetRef.current} [65535 ports]...`,
        `Discovered open port ${pick(PORTS)}/tcp on ${targetRef.current}`,
        `Discovered open port ${pick(PORTS)}/tcp on ${targetRef.current}`,
        `Discovered open port ${pick(PORTS)}/tcp on ${targetRef.current}`,
        `OS detection: ${pick(OS_LIST)} | TTL: 64 | MAC: ${randomMAC()}`,
        `Nmap done: 1 host up, scanned in 12.48 seconds`,
      ];
      line = scanLines[phase];
    } else if (phase < 14) {
      const vulnLines = [
        `root@shadow:~# exploit-scanner --deep --target ${targetRef.current}`,
        `[*] Loading vulnerability database (247,831 signatures)...`,
        `[!] CRITICAL: ${pick(VULNS)}`,
        `[!] HIGH: ${pick(VULNS)}`,
        `[*] Generating exploit chain...`,
        `[+] Exploit chain ready. Launching attack vector...`,
      ];
      line = vulnLines[phase - 8];
    } else if (phase < 22) {
      const attackLines = [
        `root@shadow:~# payload-gen --type reverse_shell --encoder shikata_ga_nai`,
        `[*] ${pick(EXPLOITS)}`,
        `[*] ${pick(EXPLOITS)}`,
        `[+] Shell session 1 opened (10.0.0.1:4444 -> ${targetRef.current}:${rand(49152, 65535)})`,
        `[*] ${pick(EXPLOITS)}`,
        `[+] Privilege escalation successful — UID=0(root)`,
        `[*] Accessing ${pick(FILE_PATHS)}...`,
        `[+] Data exfiltrated: ${rand(50, 500)}MB encrypted via ${pick(ENCRYPTION_ALGOS)}`,
      ];
      line = attackLines[phase - 14];
    } else {
      phaseRef.current = -1;
      targetRef.current = randomIP();
      line = `\n[$] Session complete. Rotating to next target: ${targetRef.current}\n`;
    }

    phaseRef.current++;
    return line;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, generateLine()];
        return next.length > 100 ? next.slice(-60) : next;
      });
    }, rand(200, 600));
    return () => clearInterval(interval);
  }, [generateLine]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Terminal // root@shadow-net</span>
        <span className="glow-red">● LIVE</span>
      </div>
      <div ref={bodyRef} className="panel-body overflow-y-auto font-mono" style={{ fontSize: "10.5px" }}>
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith("[!]") ? "glow-red" : l.startsWith("[+]") ? "glow" : ""}>
            {l}
          </div>
        ))}
        <span className="cursor-blink">█</span>
      </div>
    </div>
  );
}

// ─── Network Monitor ───────────────────────────────────────────────
function NetworkMonitor() {
  const [packets, setPackets] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const proto = pick(PROTOCOLS);
      const src = randomIP();
      const dst = randomIP();
      const port = pick(PORTS);
      const size = rand(40, 1500);
      const flags = pick(["SYN", "ACK", "SYN-ACK", "PSH-ACK", "FIN", "RST", "URG"]);
      const line = `${timestamp()} ${proto.padEnd(5)} ${src}:${rand(1024, 65535)} → ${dst}:${port} [${flags}] ${size}B`;
      setPackets((prev) => {
        const next = [...prev, line];
        return next.length > 80 ? next.slice(-50) : next;
      });
    }, rand(80, 250));
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [packets]);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Network Traffic // Packet Capture</span>
        <span className="glow-cyan">◉ SNIFFING</span>
      </div>
      <div ref={bodyRef} className="panel-body overflow-y-auto" style={{ fontSize: "9.5px" }}>
        {packets.map((p, i) => (
          <div key={i} className={p.includes("RST") || p.includes("FIN") ? "glow-red" : p.includes("SYN-ACK") ? "glow-cyan" : ""} style={{ opacity: 0.9 }}>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Password Cracker ──────────────────────────────────────────────
function PasswordCracker() {
  const [entries, setEntries] = useState<{ hash: string; pass: string; status: string }[]>([]);
  const [rate, setRate] = useState(0);
  const [cracked, setCracked] = useState(0);
  const [total] = useState(rand(200, 500));

  useEffect(() => {
    const interval = setInterval(() => {
      const found = Math.random() > 0.6;
      const passwords = ["admin123", "P@ssw0rd!", "letmein", "dragon2024", "trustno1", "hunter2", "qwerty!@#", "shadow_root", "master666", "iloveyou", "password1!", "welcome1", "monkey123", "abc123!@#", "starwars99"];
      const entry = {
        hash: randomHex(32),
        pass: found ? pick(passwords) : "...",
        status: found ? "CRACKED" : "TESTING",
      };
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > 30 ? next.slice(-20) : next;
      });
      setRate(rand(850000, 1250000));
      if (found) setCracked((p) => p + 1);
    }, rand(300, 800));
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Hash Cracker // Hashcat v7.0</span>
        <span className="glow-yellow">⚡ {(rate / 1000000).toFixed(2)} MH/s</span>
      </div>
      <div className="panel-body overflow-y-auto" style={{ fontSize: "9.5px" }}>
        <div style={{ marginBottom: 6, color: "#00ffff" }}>
          Progress: {cracked}/{total} cracked ({((cracked / total) * 100).toFixed(1)}%)
        </div>
        <div style={{ height: 6, background: "#001a00", borderRadius: 3, marginBottom: 8, border: "1px solid #003300" }}>
          <div className="progress-bar" style={{ width: `${Math.min((cracked / total) * 100, 100)}%`, borderRadius: 3 }} />
        </div>
        {entries.map((e, i) => (
          <div key={i} className={e.status === "CRACKED" ? "glow" : ""} style={{ opacity: e.status === "CRACKED" ? 1 : 0.5 }}>
            {e.hash.slice(0, 16)}... → {e.status === "CRACKED" ? (
              <span style={{ color: "#00ff41" }}>{e.pass}</span>
            ) : (
              <span style={{ color: "#666" }}>{randomHex(8)}</span>
            )}
            {" "}[{e.status}]
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Port Scanner ──────────────────────────────────────────────────
function PortScanner() {
  const [hosts, setHosts] = useState<{ ip: string; ports: { port: number; service: string; state: string }[] }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ip = randomIP();
      const numPorts = rand(2, 5);
      const ports = Array.from({ length: numPorts }, () => {
        const idx = rand(0, PORTS.length - 1);
        return {
          port: PORTS[idx],
          service: SERVICES[idx],
          state: Math.random() > 0.2 ? "open" : "filtered",
        };
      });
      setHosts((prev) => {
        const next = [...prev, { ip, ports }];
        return next.length > 15 ? next.slice(-10) : next;
      });
    }, rand(1500, 3000));
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Port Scanner // Subnet Sweep</span>
        <span style={{ color: "#00ff41" }}>◌ SCANNING</span>
      </div>
      <div className="panel-body overflow-y-auto" style={{ fontSize: "9.5px" }}>
        {hosts.map((h, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div className="glow-cyan">{h.ip}</div>
            {h.ports.map((p, j) => (
              <div key={j} style={{ paddingLeft: 12 }}>
                <span style={{ color: p.state === "open" ? "#00ff41" : "#ff6600" }}>
                  {p.port.toString().padEnd(6)}
                </span>
                <span style={{ color: "#888" }}>{p.state.padEnd(10)}</span>
                <span>{p.service}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── System Stats ──────────────────────────────────────────────────
function SystemStats() {
  const [stats, setStats] = useState({ cpu: 0, mem: 0, net: 0, threads: 0, proxies: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        cpu: rand(45, 98),
        mem: rand(60, 95),
        net: rand(100, 950),
        threads: rand(128, 512),
        proxies: rand(8, 24),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const bar = (pct: number, color: string) => (
    <div style={{ height: 4, background: "#001a00", borderRadius: 2, flex: 1, marginLeft: 8 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s", boxShadow: `0 0 6px ${color}` }} />
    </div>
  );

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>System Monitor</span>
        <span style={{ color: stats.cpu > 90 ? "#ff0040" : "#00ff41" }}>
          {stats.cpu > 90 ? "⚠ HIGH LOAD" : "● NOMINAL"}
        </span>
      </div>
      <div className="panel-body" style={{ fontSize: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span style={{ width: 90 }}>CPU Usage:</span>
          {bar(stats.cpu, stats.cpu > 85 ? "#ff0040" : "#00ff41")}
          <span style={{ marginLeft: 8, width: 35, textAlign: "right" }}>{stats.cpu}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span style={{ width: 90 }}>Memory:</span>
          {bar(stats.mem, stats.mem > 85 ? "#ff6600" : "#00ff41")}
          <span style={{ marginLeft: 8, width: 35, textAlign: "right" }}>{stats.mem}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span style={{ width: 90 }}>Network I/O:</span>
          <span className="glow-cyan" style={{ marginLeft: 8 }}>{stats.net} MB/s</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          <span>Threads: <span className="glow">{stats.threads}</span></span>
          <span>Proxy Chain: <span className="glow-yellow">{stats.proxies} nodes</span></span>
        </div>
      </div>
    </div>
  );
}

// ─── Hex Dump Viewer ───────────────────────────────────────────────
function HexDump() {
  const [lines, setLines] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const offset = rand(0, 0xffff).toString(16).padStart(8, "0");
      const bytes = Array.from({ length: 16 }, () => randomHex(2)).join(" ");
      const ascii = Array.from({ length: 16 }, () => {
        const c = rand(33, 126);
        return String.fromCharCode(c);
      }).join("");
      setLines((prev) => {
        const next = [...prev, `0x${offset}  ${bytes}  |${ascii}|`];
        return next.length > 50 ? next.slice(-30) : next;
      });
    }, rand(100, 300));
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Memory Dump // 0xDEADBEEF</span>
        <span className="glow">READING</span>
      </div>
      <div ref={bodyRef} className="panel-body overflow-y-auto" style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.5px" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: i % 5 === 0 ? "#00ffff" : "#00ff41", opacity: 0.85 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Crypto Decryptor ──────────────────────────────────────────────
function CryptoDecryptor() {
  const [logs, setLogs] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        `[DECRYPT] ${pick(ENCRYPTION_ALGOS)} key: ${randomHex(32)}`,
        `[KEYGEN] Generating ${rand(2048, 4096)}-bit RSA keypair...`,
        `[VERIFY] Certificate fingerprint: SHA256:${randomHex(32)}`,
        `[CRACK]  Rainbow table lookup: ${HASHES().slice(0, 40)}...`,
        `[INJECT] Session token forged: ${randomHex(24)}`,
        `[BYPASS] TLS pinning disabled on target process`,
        `[MITM]   Intercepted ${pick(ENCRYPTION_ALGOS)} handshake`,
        `[DUMP]   Private key extracted: ${randomHex(20)}...`,
      ];
      setLogs((prev) => {
        const next = [...prev, pick(actions)];
        return next.length > 40 ? next.slice(-25) : next;
      });
    }, rand(400, 1000));
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Crypto Engine // Decryptor</span>
        <span className="glow-yellow">🔓 ACTIVE</span>
      </div>
      <div ref={bodyRef} className="panel-body overflow-y-auto" style={{ fontSize: "9.5px" }}>
        {logs.map((l, i) => (
          <div key={i} className={l.includes("[CRACK]") ? "glow-red" : l.includes("[DUMP]") ? "glow" : ""}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Targets / World Map (ASCII) ───────────────────────────────────
function TargetMap() {
  const [targets, setTargets] = useState<{ ip: string; loc: string; status: string }[]>([]);
  const locations = ["Tokyo, JP", "New York, US", "London, UK", "Berlin, DE", "Sydney, AU", "Mumbai, IN", "São Paulo, BR", "Seoul, KR", "Moscow, RU", "Cairo, EG", "Toronto, CA", "Singapore, SG", "Dubai, AE", "Paris, FR", "Lagos, NG", "Beijing, CN"];

  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = ["COMPROMISED", "SCANNING", "EXPLOITING", "BACKDOORED", "EXFILTRATING"];
      setTargets((prev) => {
        const next = [...prev, {
          ip: randomIP(),
          loc: pick(locations),
          status: pick(statuses),
        }];
        return next.length > 18 ? next.slice(-12) : next;
      });
    }, rand(1500, 3500));
    return () => clearInterval(interval);
  }, []);

  const statusColor = (s: string) => {
    if (s === "COMPROMISED" || s === "BACKDOORED") return "#ff0040";
    if (s === "EXFILTRATING") return "#ffff00";
    if (s === "EXPLOITING") return "#ff6600";
    return "#00ffff";
  };

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Global Target Map // GeoTrace</span>
        <span className="glow-red">⊕ {targets.length} TARGETS</span>
      </div>
      <div className="panel-body overflow-y-auto" style={{ fontSize: "10px" }}>
        <pre style={{ color: "#003300", fontSize: "6.5px", lineHeight: "7.5px", marginBottom: 6, userSelect: "none" }}>
{`    .--.          .--.   .--.          .--.
  .'    \\  ____  /    '. '    \\  ____  /    '.
 /  .-. _\\/    \\/_ .-. \\ .-. _\\/    \\/_ .-. \\
| |    ( o    o  ) |  | |    ( o    o  ) |  |
 \\  '-./\\______/\\.-'  /  '-./\\______/\\.-'  /
  '.    \\/      \\/   .'    \\/      \\/   .'
    '--'          '--''--'          '--'`}
        </pre>
        <div style={{ borderTop: "1px solid #003300", paddingTop: 4 }}>
          {targets.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 2 }}>
              <span style={{ color: statusColor(t.status), width: 14, textAlign: "center" }}>●</span>
              <span style={{ width: 120, fontSize: "9.5px" }}>{t.ip}</span>
              <span style={{ color: "#00ffff", width: 100, fontSize: "9.5px" }}>{t.loc}</span>
              <span style={{ color: statusColor(t.status), fontWeight: "bold", fontSize: "9.5px" }}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Event Log ─────────────────────────────────────────────────────
function EventLog() {
  const [events, setEvents] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const severities = ["INFO", "WARN", "CRIT", "ALERT"];
      const messages = [
        "Firewall rule bypassed on gateway node",
        "New proxy chain established (TOR + 3 VPN nodes)",
        "IDS signature evasion: polymorphic encoding active",
        "Zero-day exploit loaded into memory",
        "Anti-forensics: log rotation triggered on target",
        "Lateral movement detected in subnet 10.0.0.0/24",
        "Credential dump complete: 2,847 entries",
        "Encrypted tunnel established via port 443",
        "Blockchain mixer transaction initiated",
        "Shadow copy deletion in progress on target DC",
        "New C2 beacon registered from compromised host",
        "Firmware rootkit deployed to target BMC",
        "DNS rebinding attack successful",
        "SIEM alert suppression active on target network",
        "Persistence mechanism installed: scheduled task",
        "Memory-resident payload injected into svchost.exe",
      ];
      const sev = pick(severities);
      const msg = `[${timestamp()}] [${sev}] ${pick(messages)}`;
      setEvents((prev) => {
        const next = [...prev, msg];
        return next.length > 50 ? next.slice(-30) : next;
      });
    }, rand(500, 1500));
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [events]);

  const sevColor = (line: string) => {
    if (line.includes("[CRIT]") || line.includes("[ALERT]")) return "glow-red";
    if (line.includes("[WARN]")) return "glow-yellow";
    return "";
  };

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Event Log // SHADOW_NET</span>
        <span className="pulse" style={{ color: "#ff6600" }}>▲ EVENTS</span>
      </div>
      <div ref={bodyRef} className="panel-body overflow-y-auto" style={{ fontSize: "9.5px" }}>
        {events.map((e, i) => (
          <div key={i} className={sevColor(e)}>{e}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────
function TopBar() {
  const [time, setTime] = useState("");
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toISOString().replace("T", " ").slice(0, 19));
      setUptime((p) => p + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{
      background: "rgba(0, 20, 0, 0.95)",
      borderBottom: "1px solid #00ff41",
      padding: "6px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "11px",
      letterSpacing: "1px",
      zIndex: 10,
      position: "relative",
    }}>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <span className="glow" style={{ fontSize: 14, fontWeight: "bold" }}>
          ◈ SHADOW_NET v4.2.1
        </span>
        <span style={{ color: "#666" }}>|</span>
        <span style={{ color: "#ff0040" }}>■ CLASSIFIED</span>
        <span style={{ color: "#666" }}>|</span>
        <span>OPERATOR: <span className="glow-cyan">gh0st_r00t</span></span>
      </div>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <span>UPTIME: <span style={{ color: "#ffff00" }}>{formatUptime(uptime)}</span></span>
        <span style={{ color: "#666" }}>|</span>
        <span>SESSION: <span style={{ color: "#00ff41" }}>{randomHex(8)}</span></span>
        <span style={{ color: "#666" }}>|</span>
        <span style={{ color: "#00ffff" }}>{time} UTC</span>
      </div>
    </div>
  );
}

// ─── Bottom ticker ─────────────────────────────────────────────────
function EventTicker() {
  const [text, setText] = useState("");
  const msgs = [
    "Target compromised: financial sector gateway",
    "Exfiltrating 2.4TB encrypted payload via covert channel",
    "New zero-day acquired from dark market",
    "Rotating proxy chain through 12 jurisdictions",
    "Deploying persistence mechanisms on 47 nodes",
    "Anti-forensics: wiping volatile memory traces",
    "Lateral movement in progress: domain controller access gained",
    "Blockchain laundering: 4 mixing rounds complete",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setText(pick(msgs));
    }, 3000);
    setText(pick(msgs));
    return () => clearInterval(interval);
  }, []);

  return <span className="glow-red">{text}</span>;
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function HackerDashboard() {
  const [stage, setStage] = useState<"entry" | "boot" | "dashboard">("entry");

  const handleEnter = useCallback(() => {
    setStage("boot");
  }, []);

  const handleBootComplete = useCallback(() => {
    setStage("dashboard");
  }, []);

  if (stage === "entry") {
    return <EntryScreen onEnter={handleEnter} />;
  }

  if (stage === "boot") {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#000", overflow: "hidden" }}>
      <MatrixRain />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar />
        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: 4,
          padding: 4,
          overflow: "hidden",
        }}>
          {/* Row 1 */}
          <div style={{ gridColumn: "1 / 2", gridRow: "1 / 3" }}>
            <TerminalPanel />
          </div>
          <div style={{ gridColumn: "2 / 3", gridRow: "1 / 2" }}>
            <NetworkMonitor />
          </div>
          <div style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }}>
            <PasswordCracker />
          </div>

          {/* Row 2 */}
          <div style={{ gridColumn: "2 / 3", gridRow: "2 / 3" }}>
            <TargetMap />
          </div>
          <div style={{ gridColumn: "3 / 4", gridRow: "2 / 3" }}>
            <CryptoDecryptor />
          </div>

          {/* Row 3 */}
          <div style={{ gridColumn: "1 / 2", gridRow: "3 / 4" }}>
            <PortScanner />
          </div>
          <div style={{ gridColumn: "2 / 3", gridRow: "3 / 4" }}>
            <HexDump />
          </div>
          <div style={{ gridColumn: "3 / 4", gridRow: "3 / 4" }}>
            <EventLog />
          </div>
        </div>
        {/* Bottom status bar */}
        <div style={{
          background: "rgba(0, 20, 0, 0.95)",
          borderTop: "1px solid #003300",
          padding: "4px 16px",
          fontSize: "9px",
          display: "flex",
          justifyContent: "space-between",
          color: "#006600",
          letterSpacing: "1px",
        }}>
          <span>SHADOW_NET // AUTONOMOUS ATTACK FRAMEWORK // ALL SYSTEMS OPERATIONAL</span>
          <span>
            <EventTicker />
          </span>
        </div>
      </div>
    </div>
  );
}
