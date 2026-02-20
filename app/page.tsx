"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WorldMap from "./components/WorldMap";
import NetworkGraph from "./components/NetworkGraph";
import AudioWaveform from "./components/AudioWaveform";

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
function ts() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ─── Data ──────────────────────────────────────────────────────────
const PORTS = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 993, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 27017];
const VULNS = [
  "CVE-2024-21762 // FortiOS OOB Write",
  "CVE-2024-3400 // PAN-OS Command Injection",
  "CVE-2023-44228 // Log4Shell RCE",
  "CVE-2024-1709 // ScreenConnect Auth Bypass",
  "CVE-2023-46805 // Ivanti Auth Bypass",
  "CVE-2024-27198 // TeamCity Auth Bypass",
  "CVE-2023-4966 // Citrix Bleed",
  "CVE-2024-0012 // PAN-OS Mgmt Bypass",
  "CVE-2023-22515 // Confluence Priv Esc",
  "CVE-2024-38077 // Windows RRAS RCE",
  "CVE-2024-6387 // OpenSSH regreSSHion",
  "CVE-2024-4577 // PHP-CGI Arg Injection",
];
const EXPLOITS = [
  "Deploying polymorphic shellcode via ROP chain...",
  "Injecting into kernel memory space at ring-0...",
  "Bypassing ASLR via information leak primitive...",
  "Escalating privileges via dirty pipe (CVE-2022-0847)...",
  "Establishing reverse shell on port 4444...",
  "Extracting NTLM hashes from SAM database...",
  "Dumping LSASS process memory via MiniDumpWriteDump...",
  "Deploying fileless malware payload in registry...",
  "Bypassing EDR via direct syscall invocation...",
  "Establishing C2 channel via DNS-over-HTTPS tunneling...",
  "Hijacking TLS session via downgrade attack...",
  "Exploiting race condition in auth handler...",
  "Injecting malicious DLL via AppInit_DLLs...",
  "Triggering UAF in heap allocator (tcmalloc)...",
  "Pivoting to internal network via compromised VPN...",
  "Extracting credentials from Chrome credential store...",
  "Forging Kerberos Golden Ticket (krbtgt hash)...",
  "Deploying UEFI rootkit via signed driver...",
  "Exfiltrating data via covert ICMP channel...",
  "Performing pass-the-hash lateral movement...",
  "Overwriting MBR for persistence mechanism...",
  "Enumerating Active Directory via BloodHound...",
];
const FILE_PATHS = [
  "/etc/shadow", "/etc/passwd", "/root/.ssh/id_rsa", "/root/.ssh/authorized_keys",
  "/proc/self/maps", "/var/lib/mysql/data/users.ibd",
  "C:\\Windows\\System32\\config\\SAM", "C:\\Users\\Admin\\Desktop\\secrets.xlsx",
  "/home/admin/.bash_history", "/opt/tomcat/conf/server.xml",
  "/var/www/html/wp-config.php", "/etc/nginx/sites-enabled/default",
  "C:\\Windows\\NTDS\\ntds.dit", "/var/log/auth.log",
];
const PROTOCOLS = ["TCP", "UDP", "ICMP", "TLS1.3", "SSH", "DNS", "HTTP/2", "QUIC"];
const OS_LIST = ["Win Server 2022", "Ubuntu 22.04", "CentOS 8", "Debian 12", "FreeBSD 14", "macOS Sonoma", "RHEL 9.3", "Kali 2024.1"];
const ENCRYPTION = ["AES-256-GCM", "ChaCha20-Poly1305", "RSA-4096", "Ed25519", "Camellia-256", "Twofish-256"];

// ─── Matrix Rain ───────────────────────────────────────────────────
function MatrixRain({ opacity = 0.08 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/\\|{}[];:=+-*&^%$#@!~";
    const fontSize = 13;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);
    const speeds: number[] = Array.from({ length: columns }, () => 0.5 + Math.random() * 1);

    function draw() {
      ctx!.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0) {
          const brightness = Math.random() > 0.95 ? "#ffffff" : "#00ff41";
          ctx!.fillStyle = brightness;
          ctx!.globalAlpha = Math.random() * 0.4 + 0.6;
          ctx!.font = `${fontSize}px monospace`;
          ctx!.fillText(ch, x, y);
          ctx!.globalAlpha = 1;
        }

        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.5 + Math.random() * 1;
        }
        drops[i] += speeds[i];
      }
    }

    const interval = setInterval(draw, 40);
    window.addEventListener("resize", resize);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-bg" style={{ opacity }} />;
}

// ─── Noise Overlay ─────────────────────────────────────────────────
function NoiseOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 256;
    canvas.height = 256;

    const imageData = ctx.createImageData(256, 256);
    function drawNoise() {
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255;
        imageData.data[i] = v;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v;
        imageData.data[i + 3] = 12;
      }
      ctx!.putImageData(imageData, 0, 0);
    }

    const interval = setInterval(drawNoise, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9997,
        opacity: 0.035,
      }}
    />
  );
}

// ─── Entry Screen ──────────────────────────────────────────────────
function EntryScreen({ onEnter }: { onEnter: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [glitchText, setGlitchText] = useState("INITIALIZE SYSTEM");

  useEffect(() => {
    if (!hovered) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオ0123456789!@#$%^&*";
    const original = "INITIALIZE SYSTEM";
    let iteration = 0;
    const interval = setInterval(() => {
      setGlitchText(
        original.split("").map((_, i) =>
          i < iteration ? original[i] : chars[Math.floor(Math.random() * chars.length)]
        ).join("")
      );
      iteration += 0.5;
      if (iteration >= original.length) {
        clearInterval(interval);
        setGlitchText(original);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [hovered]);

  const handleClick = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(onEnter, onEnter);
    } else if ((el as unknown as Record<string, () => void>).webkitRequestFullscreen) {
      (el as unknown as Record<string, () => void>).webkitRequestFullscreen();
      onEnter();
    } else {
      onEnter();
    }
  };

  return (
    <div className="entry-screen">
      <MatrixRain opacity={0.12} />
      <div style={{ zIndex: 10, textAlign: "center" }}>
        <pre className="glow-strong entry-logo">
{`
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
 ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
 ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║
 ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
 ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
`}
        </pre>
        <div className="glow-cyan entry-subtitle">
          AUTONOMOUS PENETRATION FRAMEWORK v4.2.1
        </div>
        <button
          className="entry-button"
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setGlitchText("INITIALIZE SYSTEM"); }}
        >
          [ {glitchText} ]
        </button>
        <div style={{ marginTop: 24, fontSize: 9, color: "#003300", letterSpacing: 2 }}>
          FULLSCREEN MODE REQUIRED FOR OPERATIONAL SECURITY
        </div>
        <div className="pulse entry-warning" style={{ color: "#004400" }}>
          WARNING: UNAUTHORIZED ACCESS WILL BE TRACED AND PROSECUTED
        </div>
      </div>
    </div>
  );
}

// ─── Boot Sequence ─────────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const boot = [
      "",
      "SHADOW_NET KERNEL v4.2.1 — SECURE BOOT",
      "═══════════════════════════════════════════════════",
      "",
      `[${ts()}] Verifying kernel integrity............ [OK]`,
      `[${ts()}] Loading exploit framework modules...... [OK]`,
      `[${ts()}] Initializing TOR relay chain (9 hops). [OK]`,
      `[${ts()}] Connecting to C2 infrastructure........ [OK]`,
      `[${ts()}] Syncing vulnerability DB (312,847 CVEs) [OK]`,
      `[${ts()}] Calibrating packet injection engine.... [OK]`,
      `[${ts()}] Spoofing MAC/IP/DNS identifiers........ [OK]`,
      `[${ts()}] Establishing encrypted tunnels (x8).... [OK]`,
      `[${ts()}] Deploying network sniffers (promiscuous) [OK]`,
      `[${ts()}] Initializing GPU hash cracker (8x RTX) [OK]`,
      `[${ts()}] Loading zero-day exploit cache......... [OK]`,
      `[${ts()}] Compiling polymorphic payload engine... [OK]`,
      `[${ts()}] Anti-forensics module initialized...... [OK]`,
      `[${ts()}] SIGINT monitoring arrays online........ [OK]`,
      "",
      "System ready. All modules operational.",
      `Session: ${randomHex(16)} | Operator: gh0st_r00t | Clearance: OMEGA`,
      "",
      ">>> INITIATING AUTONOMOUS ATTACK SEQUENCE <<<",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < boot.length) {
        const line = boot[i];
        i++;
        setLines(prev => [...prev, line]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setDone(true);
          setTimeout(onComplete, 800);
        }, 500);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{ background: "#000", width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 40, position: "relative" }}>
      <MatrixRain opacity={0.06} />
      <div style={{ zIndex: 10, maxWidth: 720, width: "100%" }}>
        <pre className="glow" style={{ fontSize: 13, marginBottom: 20, textAlign: "center", lineHeight: 1.15 }}>
{`
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
 ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
 ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║
 ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
 ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
`}
        </pre>
        <div style={{ fontSize: 11, lineHeight: 1.7, fontFamily: "'Courier New', monospace" }}>
          {lines.map((line, idx) => (
            <div key={idx} className={
              line.includes("[OK]") ? "glow" :
              line.includes(">>>") ? "glow-red-strong warning-flash" :
              line.includes("Operator") ? "glow-cyan" :
              line.includes("═") ? "glow" : ""
            }>
              {line}
            </div>
          ))}
          {!done && <span className="cursor-blink" style={{ fontSize: 14 }}>█</span>}
        </div>
        {done && (
          <div className="glow-red-strong" style={{ textAlign: "center", marginTop: 20, fontSize: 14, fontWeight: "bold", letterSpacing: 6 }}>
            ENTERING SHADOW MODE...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Panel Wrapper ─────────────────────────────────────────────────
function Panel({ title, status, statusClass, children }: {
  title: string;
  status: string;
  statusClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        <span className={`panel-status ${statusClass || ""}`}>{status}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Terminal Panel ────────────────────────────────────────────────
function TerminalPanel() {
  const [lines, setLines] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  const targetRef = useRef(randomIP());

  const gen = useCallback(() => {
    const p = phaseRef.current;
    const t = targetRef.current;

    const phases: (() => string)[] = [
      () => `root@shadow:~# nmap -sV -sC -O -A ${t}`,
      () => `Starting Nmap 7.94SVN — https://nmap.org`,
      () => `Scanning ${t} [65535 ports]...`,
      () => `Discovered open port ${pick(PORTS)}/tcp on ${t}`,
      () => `Discovered open port ${pick(PORTS)}/tcp on ${t}`,
      () => `Discovered open port ${pick(PORTS)}/tcp on ${t}`,
      () => `OS: ${pick(OS_LIST)} | TTL:64 | MAC:${randomMAC()}`,
      () => `Nmap done: 1 IP (1 host up) scanned in ${(Math.random() * 20 + 5).toFixed(2)}s`,
      () => ``,
      () => `root@shadow:~# exploit-db --scan --deep ${t}`,
      () => `[*] Loading vulnerability database (312,847 signatures)...`,
      () => `[!] CRITICAL: ${pick(VULNS)}`,
      () => `[!] HIGH: ${pick(VULNS)}`,
      () => `[!] MEDIUM: ${pick(VULNS)}`,
      () => `[+] Generating exploit chain... 3 vectors identified`,
      () => ``,
      () => `root@shadow:~# payload-gen --type meterpreter/reverse_tcp --encode shikata_ga_nai x5`,
      () => `[*] ${pick(EXPLOITS)}`,
      () => `[*] ${pick(EXPLOITS)}`,
      () => `[+] Shell session opened (10.0.0.1:4444 → ${t}:${rand(49152, 65535)})`,
      () => `[*] ${pick(EXPLOITS)}`,
      () => `[*] ${pick(EXPLOITS)}`,
      () => `[+] PRIVILEGE ESCALATION → UID=0(root) GID=0(root)`,
      () => `[*] Accessing ${pick(FILE_PATHS)}...`,
      () => `[*] Accessing ${pick(FILE_PATHS)}...`,
      () => `[+] Data exfiltrated: ${rand(50, 800)}MB via ${pick(ENCRYPTION)}`,
      () => `[+] Persistence: ${pick(["cron job", "systemd service", "registry run key", "WMI subscription"])}`,
      () => `[$] Session complete. Cleaning traces...`,
    ];

    let line: string;
    if (p < phases.length) {
      line = phases[p]();
    } else {
      phaseRef.current = -1;
      targetRef.current = randomIP();
      line = `\n[$] Rotating target → ${targetRef.current}\n`;
    }
    phaseRef.current++;
    return line;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setLines(prev => {
        const next = [...prev, gen()];
        return next.length > 150 ? next.slice(-80) : next;
      });
    }, rand(150, 500));
    return () => clearInterval(id);
  }, [gen]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  return (
    <Panel title="Terminal // root@shadow-net" status="● LIVE" statusClass="glow-red">
      <div ref={bodyRef} className="panel-body scrollable" style={{ fontSize: "9.5px" }}>
        {lines.map((l, i) => (
          <div key={i} className={
            l.startsWith("[!]") ? "glow-red" :
            l.startsWith("[+]") ? "glow" :
            l.startsWith("[$]") ? "glow-cyan" :
            l.startsWith("root@") ? "glow" : ""
          }>{l}</div>
        ))}
        <span className="cursor-blink">█</span>
      </div>
    </Panel>
  );
}

// ─── Network Monitor ───────────────────────────────────────────────
function NetworkMonitor() {
  const [pkts, setPkts] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const proto = pick(PROTOCOLS);
      const line = `${ts()} ${proto.padEnd(7)} ${randomIP()}:${rand(1024, 65535)} → ${randomIP()}:${pick(PORTS)} [${pick(["SYN", "ACK", "SYN-ACK", "PSH-ACK", "FIN", "RST", "URG"])}] ${rand(40, 1500)}B`;
      setPkts(prev => {
        const next = [...prev, line];
        return next.length > 100 ? next.slice(-60) : next;
      });
    }, rand(60, 200));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [pkts]);

  return (
    <Panel title="Packet Capture // tcpdump" status="◉ SNIFFING" statusClass="glow-cyan">
      <div ref={bodyRef} className="panel-body scrollable" style={{ fontSize: "8.5px" }}>
        {pkts.map((p, i) => (
          <div key={i} className={p.includes("RST") || p.includes("FIN") ? "glow-red" : p.includes("SYN-ACK") ? "glow-cyan" : ""} style={{ opacity: 0.85 }}>{p}</div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Password Cracker ──────────────────────────────────────────────
function PasswordCracker() {
  const [entries, setEntries] = useState<{ hash: string; pass: string; found: boolean }[]>([]);
  const [rate, setRate] = useState(0);
  const [cracked, setCracked] = useState(0);
  const [total] = useState(() => rand(200, 500));
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const found = Math.random() > 0.55;
      const passwords = ["admin123", "P@ssw0rd!", "letmein", "dragon2024", "trustno1", "hunter2", "qwerty!@#", "shadow_root", "master666", "iloveyou", "password1!", "welcome1", "monkey123", "abc123!@#", "starwars99", "football99", "123456789", "superman1"];
      setEntries(prev => {
        const next = [...prev, { hash: randomHex(32), pass: found ? pick(passwords) : "", found }];
        return next.length > 40 ? next.slice(-25) : next;
      });
      setRate(rand(850000, 1350000));
      if (found) setCracked(p => p + 1);
    }, rand(250, 700));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [entries]);

  const pct = Math.min((cracked / total) * 100, 99.9);

  return (
    <Panel title="Hash Cracker // Hashcat v7.0" status={`⚡ ${(rate / 1e6).toFixed(2)} MH/s`} statusClass="glow-yellow">
      <div className="panel-body scrollable" style={{ fontSize: "9px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span className="glow-cyan" style={{ fontSize: "9px" }}>{cracked}/{total} cracked ({pct.toFixed(1)}%)</span>
          <span style={{ fontSize: "8px", color: "#666" }}>SHA-256 | GPU x8</span>
        </div>
        <div className="progress-track" style={{ marginBottom: 6 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div ref={bodyRef} style={{ overflow: "auto", flex: 1 }}>
          {entries.map((e, i) => (
            <div key={i} className={e.found ? "glow" : ""} style={{ opacity: e.found ? 1 : 0.4 }}>
              {e.hash.slice(0, 16)}… → {e.found ? <span style={{ color: "#00ff41" }}>{e.pass}</span> : <span style={{ color: "#333" }}>{randomHex(8)}</span>} [{e.found ? "CRACKED" : "TESTING"}]
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ─── Hex Dump ──────────────────────────────────────────────────────
function HexDump() {
  const [lines, setLines] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const off = rand(0, 0xfffff).toString(16).padStart(8, "0");
      const bytes = Array.from({ length: 16 }, () => randomHex(2)).join(" ");
      const ascii = Array.from({ length: 16 }, () => String.fromCharCode(rand(33, 126))).join("");
      setLines(prev => {
        const next = [...prev, `0x${off}  ${bytes}  |${ascii}|`];
        return next.length > 60 ? next.slice(-35) : next;
      });
    }, rand(60, 180));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  return (
    <Panel title="Memory Dump // 0xDEADBEEF" status="READING" statusClass="glow">
      <div ref={bodyRef} className="panel-body scrollable" style={{ fontSize: "8px", letterSpacing: "0.3px" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: i % 7 === 0 ? "#00ffff" : "#00ff41", opacity: 0.8 }}>{l}</div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Crypto Engine ─────────────────────────────────────────────────
function CryptoEngine() {
  const [logs, setLogs] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const actions = [
        `[DECRYPT] ${pick(ENCRYPTION)} key: ${randomHex(32)}`,
        `[KEYGEN] Generating ${rand(2048, 4096)}-bit RSA keypair...`,
        `[VERIFY] Cert fingerprint: SHA256:${randomHex(32)}`,
        `[CRACK]  Rainbow table: ${randomHex(40)}…`,
        `[INJECT] Session token forged: ${randomHex(24)}`,
        `[BYPASS] TLS cert pinning disabled on PID ${rand(1000, 65535)}`,
        `[MITM]   Intercepted ${pick(ENCRYPTION)} handshake`,
        `[DUMP]   Private key extracted: -----BEGIN RSA KEY-----`,
        `[FORGE]  JWT crafted: alg=none, sub=admin, exp=∞`,
        `[STRIP]  SSL downgrade: TLS1.3 → TLS1.0 (POODLE)`,
      ];
      setLogs(prev => {
        const next = [...prev, pick(actions)];
        return next.length > 50 ? next.slice(-30) : next;
      });
    }, rand(350, 900));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [logs]);

  return (
    <Panel title="Crypto Engine // Decryptor" status="🔓 ACTIVE" statusClass="glow-yellow">
      <div ref={bodyRef} className="panel-body scrollable" style={{ fontSize: "9px" }}>
        {logs.map((l, i) => (
          <div key={i} className={l.includes("[CRACK]") || l.includes("[DUMP]") ? "glow-red" : l.includes("[INJECT]") || l.includes("[FORGE]") ? "glow" : ""}>{l}</div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Event Log ─────────────────────────────────────────────────────
function EventLog() {
  const [events, setEvents] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const msgs = [
      "Firewall rule bypassed on perimeter gateway",
      "New proxy chain: TOR → VPN(CH) → VPN(IS) → VPN(PA)",
      "IDS evasion: polymorphic encoding + fragmentation",
      "Zero-day exploit staged in memory (fileless)",
      "Anti-forensics: log tampering on target syslog",
      "Lateral movement: subnet 10.0.0.0/24 enumerated",
      "Credential dump: 12,847 NTLM hashes extracted",
      "Encrypted tunnel via DNS-over-HTTPS (DoH)",
      "Blockchain mixer: 4 rounds complete, 99.7% anonymity",
      "Shadow copy deletion on target domain controller",
      "C2 beacon check-in from compromised host",
      "UEFI rootkit deployed to target BMC/IPMI",
      "DNS rebinding attack: internal service exposed",
      "SIEM alert suppression: rule ID 4625 disabled",
      "WMI persistence: event subscription installed",
      "AMSI bypass: patching amsi.dll in-memory",
      "Kerberoasting: 47 SPN tickets captured",
      "BloodHound path: User → Admin in 3 hops",
    ];
    const id = setInterval(() => {
      const sev = pick(["INFO", "INFO", "WARN", "CRIT", "ALERT"]);
      setEvents(prev => {
        const next = [...prev, `[${ts()}] [${sev.padEnd(5)}] ${pick(msgs)}`];
        return next.length > 60 ? next.slice(-35) : next;
      });
    }, rand(400, 1200));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [events]);

  return (
    <Panel title="Event Log // SHADOW_NET" status="▲ EVENTS" statusClass="pulse glow-orange">
      <div ref={bodyRef} className="panel-body scrollable" style={{ fontSize: "9px" }}>
        {events.map((e, i) => (
          <div key={i} className={
            e.includes("[CRIT ]") || e.includes("[ALERT]") ? "log-alert" :
            e.includes("[WARN ]") ? "log-warn" : "log-info"
          }>{e}</div>
        ))}
      </div>
    </Panel>
  );
}

// ─── System Monitor with Sparklines ────────────────────────────────
function SystemMonitor() {
  const [stats, setStats] = useState({ cpu: 72, mem: 68, gpu: 94, net: 450, disk: 220, threads: 256, proxies: 12, sessions: 4 });
  const cpuHistory = useRef<number[]>(Array.from({ length: 40 }, () => rand(40, 95)));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const cpu = rand(45, 98);
      cpuHistory.current.push(cpu);
      if (cpuHistory.current.length > 40) cpuHistory.current.shift();
      setStats({
        cpu,
        mem: rand(60, 95),
        gpu: rand(88, 99),
        net: rand(100, 950),
        disk: rand(50, 400),
        threads: rand(128, 512),
        proxies: rand(8, 24),
        sessions: rand(2, 12),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const data = cpuHistory.current;
    const step = w / (data.length - 1);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(0, 255, 65, 0.3)");
    grad.addColorStop(1, "rgba(0, 255, 65, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => ctx.lineTo(i * step, h - (v / 100) * h));
    ctx.lineTo(w, h);
    ctx.fill();

    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#00ff41";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - (v / 100) * h;
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
  }, [stats]);

  const bar = (label: string, val: number, max: number, color: string) => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 4, fontSize: "9px" }}>
      <span style={{ width: 42, flexShrink: 0 }}>{label}</span>
      <div className="bar-track" style={{ marginLeft: 6, marginRight: 6 }}>
        <div className={`bar-fill bar-fill-${color}`} style={{ width: `${(val / max) * 100}%` }} />
      </div>
      <span style={{ width: 42, textAlign: "right", flexShrink: 0 }}>{val}{max === 100 ? "%" : "MB/s"}</span>
    </div>
  );

  return (
    <Panel title="System Monitor" status={stats.cpu > 90 ? "⚠ HIGH" : "● OK"} statusClass={stats.cpu > 90 ? "glow-red fast-pulse" : "glow"}>
      <div className="panel-body" style={{ fontSize: "9px" }}>
        <canvas ref={canvasRef} width={200} height={35} style={{ width: "100%", height: 35, marginBottom: 6 }} />
        {bar("CPU", stats.cpu, 100, stats.cpu > 85 ? "red" : "green")}
        {bar("MEM", stats.mem, 100, stats.mem > 85 ? "orange" : "green")}
        {bar("GPU", stats.gpu, 100, "yellow")}
        {bar("NET", stats.net, 1000, "green")}
        <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: "8.5px", color: "#888" }}>
          <span>THR: <span className="glow">{stats.threads}</span></span>
          <span>PRX: <span className="glow-yellow">{stats.proxies}</span></span>
          <span>SESS: <span className="glow-cyan">{stats.sessions}</span></span>
        </div>
      </div>
    </Panel>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────
function TopBar() {
  const [time, setTime] = useState("");
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toISOString().replace("T", " ").slice(0, 19));
      setUptime(p => p + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="top-bar">
      <div className="top-bar-section">
        <span className="glow-strong" style={{ fontSize: 12, fontWeight: "bold" }}>◈ SHADOW_NET v4.2.1</span>
        <span className="top-bar-divider">│</span>
        <span className="glow-red" style={{ fontSize: 9, letterSpacing: 2 }}>■ CLASSIFIED</span>
        <span className="top-bar-divider">│</span>
        <span style={{ fontSize: 9 }}>OPERATOR: <span className="glow-cyan">gh0st_r00t</span></span>
        <span className="top-bar-divider">│</span>
        <span style={{ fontSize: 9 }}>CLEARANCE: <span className="glow-yellow">OMEGA</span></span>
      </div>
      <div className="top-bar-section">
        <span style={{ fontSize: 9 }}>UP: <span style={{ color: "#ffff00" }}>{fmt(uptime)}</span></span>
        <span className="top-bar-divider">│</span>
        <span style={{ fontSize: 9, color: "#00ffff" }}>{time} UTC</span>
      </div>
    </div>
  );
}

// ─── Bottom Ticker ─────────────────────────────────────────────────
function BottomBar() {
  const [text, setText] = useState("");
  const msgsRef = useRef([
    "ACTIVE OPS: Financial sector gateway compromised — exfiltrating transaction logs",
    "ALERT: New zero-day acquired from darknet market — CVE pending assignment",
    "STATUS: Proxy chain rotating through 12 jurisdictions — no correlation possible",
    "PROGRESS: Persistence mechanisms deployed on 47 nodes across 3 continents",
    "OPSEC: Anti-forensics active — wiping volatile memory traces on all targets",
    "LATERAL: Domain controller access gained — full AD enumeration in progress",
    "CRYPTO: Blockchain mixing complete — 4 rounds, 99.7% transaction anonymity",
    "SIGINT: Intercepted encrypted communications from target C-suite",
  ]);

  useEffect(() => {
    const msgs = msgsRef.current;
    setText(msgs[0]);
    const id = setInterval(() => setText(pick(msgs)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bottom-bar">
      <span>SHADOW_NET // AUTONOMOUS ATTACK FRAMEWORK // ALL SYSTEMS OPERATIONAL</span>
      <span className="glow-red" style={{ fontSize: 8 }}>{text}</span>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────
export default function HackerDashboard() {
  const [stage, setStage] = useState<"entry" | "boot" | "dashboard">("entry");

  const handleEnter = useCallback(() => setStage("boot"), []);
  const handleBoot = useCallback(() => setStage("dashboard"), []);

  if (stage === "entry") return <EntryScreen onEnter={handleEnter} />;
  if (stage === "boot") return <BootSequence onComplete={handleBoot} />;

  return (
    <div className="dashboard">
      <MatrixRain opacity={0.07} />
      <NoiseOverlay />
      <div className="crt-overlay" />
      <div className="dashboard-content crt-flicker glitch-container">
        <TopBar />
        <div className="dashboard-grid">
          {/* Row 1-2, Col 1: Terminal (tall) */}
          <div style={{ gridColumn: "1", gridRow: "1 / 3" }}>
            <TerminalPanel />
          </div>

          {/* Row 1, Col 2-3: World Map (wide) */}
          <div style={{ gridColumn: "2 / 4", gridRow: "1" }}>
            <Panel title="Global Attack Map // GeoTrace v3.1" status="⊕ TRACKING" statusClass="glow-red">
              <div className="panel-body" style={{ padding: 0 }}>
                <WorldMap />
              </div>
            </Panel>
          </div>

          {/* Row 1, Col 4: System Monitor */}
          <div style={{ gridColumn: "4", gridRow: "1" }}>
            <SystemMonitor />
          </div>

          {/* Row 2, Col 2: Network Graph */}
          <div style={{ gridColumn: "2", gridRow: "2" }}>
            <Panel title="Network Topology // Live" status="◉ MAPPING" statusClass="glow-cyan">
              <div className="panel-body" style={{ padding: 0 }}>
                <NetworkGraph />
              </div>
            </Panel>
          </div>

          {/* Row 2, Col 3: Password Cracker */}
          <div style={{ gridColumn: "3", gridRow: "2" }}>
            <PasswordCracker />
          </div>

          {/* Row 2, Col 4: Crypto Engine */}
          <div style={{ gridColumn: "4", gridRow: "2" }}>
            <CryptoEngine />
          </div>

          {/* Row 3, Col 1: Network Monitor */}
          <div style={{ gridColumn: "1", gridRow: "3" }}>
            <NetworkMonitor />
          </div>

          {/* Row 3, Col 2: Audio Waveform (SIGINT) */}
          <div style={{ gridColumn: "2", gridRow: "3" }}>
            <Panel title="SIGINT // Signal Intercept" status="◈ MONITORING" statusClass="glow-cyan">
              <div className="panel-body" style={{ padding: 0 }}>
                <AudioWaveform />
              </div>
            </Panel>
          </div>

          {/* Row 3, Col 3: Hex Dump */}
          <div style={{ gridColumn: "3", gridRow: "3" }}>
            <HexDump />
          </div>

          {/* Row 3, Col 4: Event Log */}
          <div style={{ gridColumn: "4", gridRow: "3" }}>
            <EventLog />
          </div>
        </div>
        <BottomBar />
      </div>
    </div>
  );
}
