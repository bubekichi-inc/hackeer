"use client";

import { useRef, useEffect, useCallback } from "react";

// --- Types ---

type NodeStatus = "secure" | "scanning" | "compromised" | "exfiltrating";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  status: NodeStatus;
  statusTimer: number;
  pulsePhase: number;
  shockwave: number | null; // null = inactive, 0..1 = expanding
}

interface GraphEdge {
  source: number;
  target: number;
}

interface DataPacket {
  edgeIndex: number;
  t: number; // 0..1 progress along edge
  speed: number;
  forward: boolean; // direction
}

interface ExfilParticle {
  nodeIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
}

// --- Initial data ---

function buildInitialNodes(): GraphNode[] {
  const labels = [
    "DB-01",
    "DB-02",
    "WEB-01",
    "WEB-02",
    "WEB-03",
    "FW-01",
    "FW-02",
    "DC-01",
    "DC-02",
    "API-01",
    "API-07",
    "DNS-01",
    "SMTP-02",
    "PROXY-04",
    "NAS-01",
    "LOG-01",
    "AUTH-01",
    "LB-01",
  ];

  return labels.map((label, i) => {
    const angle = (i / labels.length) * Math.PI * 2;
    const radius = 120 + Math.random() * 80;
    return {
      id: `node-${i}`,
      label,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      status: "secure" as NodeStatus,
      statusTimer: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      shockwave: null,
    };
  });
}

function buildInitialEdges(nodeCount: number): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const added = new Set<string>();

  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (added.has(key)) return;
    added.add(key);
    edges.push({ source: a, target: b });
  };

  // Create a connected backbone
  for (let i = 1; i < nodeCount; i++) {
    const target = Math.floor(Math.random() * i);
    addEdge(i, target);
  }

  // Add extra edges so each node has 1-3 connections
  for (let i = 0; i < nodeCount; i++) {
    const currentCount = edges.filter(
      (e) => e.source === i || e.target === i
    ).length;
    const desired = 1 + Math.floor(Math.random() * 3);
    for (let j = currentCount; j < desired; j++) {
      const target = Math.floor(Math.random() * nodeCount);
      addEdge(i, target);
    }
  }

  return edges;
}

// --- Component ---

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    packets: DataPacket[];
    exfilParticles: ExfilParticle[];
    width: number;
    height: number;
    nextCompromiseTime: number;
    time: number;
  } | null>(null);

  const initState = useCallback(() => {
    const nodes = buildInitialNodes();
    const edges = buildInitialEdges(nodes.length);
    return {
      nodes,
      edges,
      packets: [] as DataPacket[],
      exfilParticles: [] as ExfilParticle[],
      width: 800,
      height: 600,
      nextCompromiseTime: 3 + Math.random() * 2,
      time: 0,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = initState();
    stateRef.current = state;

    // --- Resize ---
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        state.width = width;
        state.height = height;
      }
    });

    const parent = canvas.parentElement;
    if (parent) {
      ro.observe(parent);
    }

    // --- Physics ---
    const REPULSION = 3000;
    const ATTRACTION = 0.005;
    const CENTER_GRAVITY = 0.002;
    const DAMPING = 0.92;
    const MIN_DIST = 40;

    function updatePhysics(dt: number) {
      const { nodes, edges, width, height } = state;
      const cx = width / 2;
      const cy = height / 2;

      // Repulsion between all pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MIN_DIST) dist = MIN_DIST;
          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx * dt;
          nodes[i].vy -= fy * dt;
          nodes[j].vx += fx * dt;
          nodes[j].vy += fy * dt;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const a = nodes[edge.source];
        const b = nodes[edge.target];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idealDist = 100;
        const diff = dist - idealDist;
        const fx = dx * ATTRACTION * diff;
        const fy = dy * ATTRACTION * diff;
        a.vx += fx * dt;
        a.vy += fy * dt;
        b.vx -= fx * dt;
        b.vy -= fy * dt;
      }

      // Center gravity + velocity integration
      for (const node of nodes) {
        node.vx += (cx - node.x) * CENTER_GRAVITY * dt;
        node.vy += (cy - node.y) * CENTER_GRAVITY * dt;
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;

        // Keep inside bounds with padding
        const pad = 30;
        if (node.x < pad) {
          node.x = pad;
          node.vx = Math.abs(node.vx) * 0.5;
        }
        if (node.x > width - pad) {
          node.x = width - pad;
          node.vx = -Math.abs(node.vx) * 0.5;
        }
        if (node.y < pad) {
          node.y = pad;
          node.vy = Math.abs(node.vy) * 0.5;
        }
        if (node.y > height - pad) {
          node.y = height - pad;
          node.vy = -Math.abs(node.vy) * 0.5;
        }
      }
    }

    // --- Compromise logic ---
    function updateCompromise(dt: number) {
      state.time += dt;

      // Progress scanning -> compromised transitions
      for (const node of state.nodes) {
        if (node.status === "scanning") {
          node.statusTimer += dt;
          if (node.statusTimer >= 2) {
            node.status = "compromised";
            node.statusTimer = 0;
            node.shockwave = 0;
          }
        } else if (node.status === "compromised") {
          node.statusTimer += dt;
          if (node.statusTimer >= 3) {
            node.status = "exfiltrating";
            node.statusTimer = 0;
          }
        }
      }

      // Trigger new compromise
      state.nextCompromiseTime -= dt;
      if (state.nextCompromiseTime <= 0) {
        const secureNodes = state.nodes.filter((n) => n.status === "secure");
        if (secureNodes.length > 0) {
          const target =
            secureNodes[Math.floor(Math.random() * secureNodes.length)];
          target.status = "scanning";
          target.statusTimer = 0;
        } else {
          // Reset all to secure for continuous animation
          for (const node of state.nodes) {
            node.status = "secure";
            node.statusTimer = 0;
            node.shockwave = null;
          }
        }
        state.nextCompromiseTime = 3 + Math.random() * 2;
      }

      // Update shockwaves
      for (const node of state.nodes) {
        if (node.shockwave !== null) {
          node.shockwave += dt * 0.8;
          if (node.shockwave > 1) {
            node.shockwave = null;
          }
        }
      }
    }

    // --- Packets ---
    function updatePackets(dt: number) {
      // Spawn new packets periodically
      if (Math.random() < dt * 2) {
        const edgeIdx = Math.floor(Math.random() * state.edges.length);
        state.packets.push({
          edgeIndex: edgeIdx,
          t: 0,
          speed: 0.3 + Math.random() * 0.5,
          forward: Math.random() > 0.5,
        });
      }

      // Update existing
      state.packets = state.packets.filter((p) => {
        p.t += p.speed * dt;
        return p.t < 1;
      });
    }

    // --- Exfil particles ---
    function updateExfilParticles(dt: number) {
      // Spawn from exfiltrating nodes
      for (let i = 0; i < state.nodes.length; i++) {
        const node = state.nodes[i];
        if (
          node.status === "exfiltrating" ||
          node.status === "compromised"
        ) {
          if (Math.random() < dt * 8) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            state.exfilParticles.push({
              nodeIndex: i,
              x: node.x,
              y: node.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
            });
          }
        }
      }

      // Update particles
      state.exfilParticles = state.exfilParticles.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.8;
        return p.life > 0;
      });
    }

    // --- Drawing ---
    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const { nodes, edges, packets, exfilParticles, width, height } = state;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);

      const now = performance.now() / 1000;

      // -- Draw edges --
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const a = nodes[edge.source];
        const b = nodes[edge.target];

        // Check if a packet is on this edge
        const hasPacket = packets.some((p) => p.edgeIndex === i);

        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);

        if (hasPacket) {
          ctx!.strokeStyle = "#00ff41";
          ctx!.lineWidth = 1.5;
          ctx!.shadowColor = "#00ff41";
          ctx!.shadowBlur = 6;
        } else {
          ctx!.strokeStyle = "#003300";
          ctx!.lineWidth = 0.8;
          ctx!.shadowColor = "transparent";
          ctx!.shadowBlur = 0;
        }
        ctx!.stroke();
        ctx!.shadowBlur = 0;
      }

      // -- Draw data packets --
      for (const packet of packets) {
        const edge = edges[packet.edgeIndex];
        const a = nodes[edge.source];
        const b = nodes[edge.target];
        const t = packet.forward ? packet.t : 1 - packet.t;
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;

        ctx!.beginPath();
        ctx!.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = "#00ff41";
        ctx!.shadowColor = "#00ff41";
        ctx!.shadowBlur = 8;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // -- Draw exfil particles --
      for (const p of exfilParticles) {
        const alpha = p.life * 0.7;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 60, 60, ${alpha})`;
        ctx!.shadowColor = `rgba(255, 0, 0, ${alpha})`;
        ctx!.shadowBlur = 4;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // -- Draw shockwaves --
      for (const node of nodes) {
        if (node.shockwave !== null) {
          const radius = node.shockwave * 80;
          const alpha = 1 - node.shockwave;
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
          ctx!.lineWidth = 2 * (1 - node.shockwave);
          ctx!.shadowColor = `rgba(255, 0, 0, ${alpha * 0.5})`;
          ctx!.shadowBlur = 10;
          ctx!.stroke();
          ctx!.shadowBlur = 0;
        }
      }

      // -- Draw nodes --
      for (const node of nodes) {
        const pulse = Math.sin(now * 3 + node.pulsePhase) * 0.5 + 0.5;
        let color: string;
        let glowColor: string;
        let radius: number;
        let glowBlur: number;

        switch (node.status) {
          case "secure":
            color = "#00ff41";
            glowColor = "#00ff41";
            radius = 5;
            glowBlur = 6 + pulse * 3;
            break;
          case "scanning":
            color = `rgb(${200 + pulse * 55}, ${200 + pulse * 55}, 0)`;
            glowColor = "#ffff00";
            radius = 5 + pulse * 3;
            glowBlur = 10 + pulse * 8;
            break;
          case "compromised":
            color = "#ff3333";
            glowColor = "#ff0000";
            radius = 6;
            glowBlur = 12 + pulse * 6;
            break;
          case "exfiltrating":
            color = "#ff2222";
            glowColor = "#ff0000";
            radius = 6 + pulse * 2;
            glowBlur = 15 + pulse * 10;
            break;
        }

        // Outer glow
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.shadowColor = glowColor;
        ctx!.shadowBlur = glowBlur;
        ctx!.fill();

        // Inner bright core
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius * 0.5, 0, Math.PI * 2);
        ctx!.fillStyle = "#ffffff";
        ctx!.globalAlpha = 0.4 + pulse * 0.2;
        ctx!.fill();
        ctx!.globalAlpha = 1;
        ctx!.shadowBlur = 0;

        // Scanning ring animation
        if (node.status === "scanning") {
          const ringPhase = (now * 2 + node.pulsePhase) % 1;
          const ringRadius = radius + ringPhase * 15;
          const ringAlpha = 1 - ringPhase;
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(255, 255, 0, ${ringAlpha * 0.6})`;
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }

        // Label
        ctx!.font = "9px monospace";
        ctx!.textAlign = "center";
        ctx!.fillStyle =
          node.status === "secure"
            ? "rgba(0, 255, 65, 0.7)"
            : node.status === "scanning"
              ? "rgba(255, 255, 0, 0.7)"
              : "rgba(255, 80, 80, 0.7)";
        ctx!.fillText(node.label, node.x, node.y + radius + 12);
      }
    }

    // --- Animation loop ---
    let lastTime = performance.now();
    let animId: number;

    function loop(timestamp: number) {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = timestamp;

      updatePhysics(dt);
      updateCompromise(dt);
      updatePackets(dt);
      updateExfilParticles(dt);
      draw();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [initState]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
}
