"use client";

import { useRef, useEffect } from "react";

interface ChannelConfig {
  label: string;
  color: string;
  glowColor: string;
}

const CHANNELS: ChannelConfig[] = [
  { label: "SIGINT CHANNEL A", color: "#00ff41", glowColor: "#00ff41" },
  { label: "SIGINT CHANNEL B", color: "#00ffff", glowColor: "#00ffff" },
  { label: "SIGINT CHANNEL C", color: "#ffff00", glowColor: "#ffff00" },
];

export default function AudioWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    // --- State for waveform generation ---
    let timeOffset = 0;

    // Channel B burst state
    let burstActive = false;
    let burstTimer = 0;
    let burstDuration = 0;
    let burstCooldown = Math.random() * 60 + 30;
    let burstFrequency = 0;

    // Channel C morse state
    const morsePattern: { on: boolean; duration: number }[] = [];
    let morseIndex = 0;
    let morseTimer = 0;
    let morseCurrentOn = false;

    // Spike state
    interface SpikeState {
      active: boolean;
      channel: number;
      intensity: number;
      decay: number;
      timer: number;
      nextSpikeIn: number;
    }

    const spike: SpikeState = {
      active: false,
      channel: 0,
      intensity: 0,
      decay: 0,
      timer: 0,
      nextSpikeIn: Math.random() * 300 + 300, // 5-10 seconds at 60fps
    };

    // Waveform history buffers (store y-values for scrolling)
    const BUFFER_SIZE = 2048;
    const bufferA = new Float32Array(BUFFER_SIZE);
    const bufferB = new Float32Array(BUFFER_SIZE);
    const bufferC = new Float32Array(BUFFER_SIZE);
    let bufferWriteIndex = 0;

    // Generate initial morse pattern
    function generateMorsePattern() {
      morsePattern.length = 0;
      // Generate a sequence of dots, dashes, and spaces
      const elements = Math.floor(Math.random() * 15) + 10;
      for (let i = 0; i < elements; i++) {
        const r = Math.random();
        if (r < 0.3) {
          // dot
          morsePattern.push({ on: true, duration: Math.floor(Math.random() * 4) + 3 });
          morsePattern.push({ on: false, duration: Math.floor(Math.random() * 3) + 2 });
        } else if (r < 0.6) {
          // dash
          morsePattern.push({ on: true, duration: Math.floor(Math.random() * 6) + 8 });
          morsePattern.push({ on: false, duration: Math.floor(Math.random() * 3) + 2 });
        } else if (r < 0.8) {
          // letter space
          morsePattern.push({ on: false, duration: Math.floor(Math.random() * 8) + 6 });
        } else {
          // word space
          morsePattern.push({ on: false, duration: Math.floor(Math.random() * 15) + 12 });
        }
      }
      morseIndex = 0;
      morseTimer = 0;
    }
    generateMorsePattern();

    // Amplitude modulation phase
    let ampModPhase = Math.random() * Math.PI * 2;

    // Generate one sample for each channel
    function generateSamples() {
      const t = timeOffset * 0.02;
      ampModPhase += 0.0003;

      // --- Channel A: smooth sine with noise and amplitude modulation ---
      const ampMod = 0.5 + 0.5 * Math.sin(ampModPhase);
      const baseA =
        Math.sin(t) +
        Math.sin(t * 2.7) * 0.3 +
        Math.sin(t * 0.5) * 0.2 +
        (Math.random() - 0.5) * 0.1;
      let sampleA = baseA * (0.4 + ampMod * 0.6);

      // --- Channel B: bursty encrypted data ---
      let sampleB = (Math.random() - 0.5) * 0.03; // background static

      burstCooldown--;
      if (burstActive) {
        burstTimer--;
        // High frequency noise bursts
        const burstSignal =
          Math.sin(t * burstFrequency) * 0.7 +
          Math.sin(t * burstFrequency * 1.5) * 0.3 +
          (Math.random() - 0.5) * 0.4;
        const envelope = Math.min(1, burstTimer / 5, (burstDuration - (burstDuration - burstTimer)) / 5);
        sampleB = burstSignal * Math.max(0, envelope);
        if (burstTimer <= 0) {
          burstActive = false;
          burstCooldown = Math.random() * 80 + 20;
        }
      } else {
        if (burstCooldown <= 0) {
          burstActive = true;
          burstDuration = Math.floor(Math.random() * 40) + 10;
          burstTimer = burstDuration;
          burstFrequency = Math.random() * 20 + 8;
        }
      }

      // --- Channel C: morse-code-like pattern ---
      let sampleC = (Math.random() - 0.5) * 0.05; // background static

      morseTimer--;
      if (morseTimer <= 0) {
        morseIndex++;
        if (morseIndex >= morsePattern.length) {
          generateMorsePattern();
        }
        const elem = morsePattern[morseIndex];
        morseCurrentOn = elem.on;
        morseTimer = elem.duration;
      }

      if (morseCurrentOn) {
        // Square-ish wave with slight rounding + noise
        const morseSignal =
          Math.sign(Math.sin(t * 12)) * 0.6 +
          Math.sin(t * 12) * 0.3 +
          (Math.random() - 0.5) * 0.08;
        sampleC = morseSignal;
      }

      // --- Spike logic ---
      spike.timer++;
      if (!spike.active && spike.timer >= spike.nextSpikeIn) {
        spike.active = true;
        spike.channel = Math.floor(Math.random() * 3);
        spike.intensity = 1.0;
        spike.decay = 0;
        spike.timer = 0;
        spike.nextSpikeIn = Math.random() * 300 + 300;
      }

      if (spike.active) {
        spike.decay += 0.02;
        spike.intensity = Math.max(0, 1.0 - spike.decay);
        if (spike.intensity <= 0) {
          spike.active = false;
          spike.timer = 0;
        } else {
          const spikeVal = spike.intensity * 2.5 * Math.sin(t * 30 + Math.random() * 0.5);
          if (spike.channel === 0) sampleA += spikeVal;
          else if (spike.channel === 1) sampleB += spikeVal;
          else sampleC += spikeVal;
        }
      }

      // Clamp
      sampleA = Math.max(-1.5, Math.min(1.5, sampleA));
      sampleB = Math.max(-1.5, Math.min(1.5, sampleB));
      sampleC = Math.max(-1.5, Math.min(1.5, sampleC));

      // Write to buffers
      bufferA[bufferWriteIndex % BUFFER_SIZE] = sampleA;
      bufferB[bufferWriteIndex % BUFFER_SIZE] = sampleB;
      bufferC[bufferWriteIndex % BUFFER_SIZE] = sampleC;
      bufferWriteIndex++;

      timeOffset++;
    }

    function drawChannel(
      channelIndex: number,
      buffer: Float32Array,
      config: ChannelConfig,
      yCenter: number,
      channelHeight: number
    ) {
      if (!ctx) return;

      const halfHeight = channelHeight * 0.4;
      const isSpiking = spike.active && spike.channel === channelIndex;

      // Draw faint center line
      ctx.strokeStyle = `${config.color}18`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yCenter);
      ctx.lineTo(width, yCenter);
      ctx.stroke();

      // Draw faint grid lines
      ctx.strokeStyle = `${config.color}08`;
      ctx.lineWidth = 0.5;
      for (let g = -2; g <= 2; g++) {
        if (g === 0) continue;
        const gy = yCenter + (g / 2) * halfHeight;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Draw waveform
      const drawColor = isSpiking
        ? `rgba(255, ${Math.floor(60 * (1 - spike.intensity))}, ${Math.floor(60 * (1 - spike.intensity))}, 1)`
        : config.color;
      const glowColor = isSpiking ? "#ff0000" : config.glowColor;

      ctx.save();
      ctx.shadowBlur = isSpiking ? 20 + spike.intensity * 30 : 8;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = isSpiking ? 2.5 : 1.5;
      ctx.beginPath();

      const samplesOnScreen = Math.min(width, bufferWriteIndex);
      const startIdx = bufferWriteIndex - samplesOnScreen;

      for (let x = 0; x < width; x++) {
        const sampleIdx = startIdx + Math.floor((x / width) * samplesOnScreen);
        const val = buffer[((sampleIdx % BUFFER_SIZE) + BUFFER_SIZE) % BUFFER_SIZE];
        const y = yCenter - val * halfHeight;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw a second pass for extra glow
      ctx.globalAlpha = 0.3;
      ctx.shadowBlur = isSpiking ? 40 : 16;
      ctx.lineWidth = isSpiking ? 4 : 3;
      ctx.stroke();
      ctx.restore();

      // Spike flash overlay
      if (isSpiking && spike.intensity > 0.5) {
        ctx.save();
        const flashAlpha = (spike.intensity - 0.5) * 0.15;
        ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
        ctx.fillRect(0, yCenter - channelHeight / 2, width, channelHeight);
        ctx.restore();
      }

      // Draw label
      ctx.save();
      ctx.font = "10px monospace";
      ctx.fillStyle = `${config.color}88`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = config.glowColor;
      ctx.fillText(config.label, 8, yCenter - halfHeight + 14);

      // Draw signal strength indicator
      const latestVal = buffer[((bufferWriteIndex - 1) % BUFFER_SIZE + BUFFER_SIZE) % BUFFER_SIZE];
      const signalStrength = Math.abs(latestVal);
      const barWidth = 40;
      const barHeight = 4;
      const barX = 8;
      const barY = yCenter - halfHeight + 20;
      ctx.fillStyle = `${config.color}30`;
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = `${config.color}90`;
      ctx.fillRect(barX, barY, Math.min(barWidth, barWidth * signalStrength), barHeight);

      // Frequency / status text
      ctx.font = "9px monospace";
      ctx.fillStyle = `${config.color}55`;
      const freqText =
        channelIndex === 0
          ? `${(137.5 + Math.sin(timeOffset * 0.001) * 2.3).toFixed(3)} MHz`
          : channelIndex === 1
          ? `PKT ${(bufferWriteIndex * 7 + 4821) % 99999}`
          : `WPM: ${(12 + Math.floor(Math.sin(timeOffset * 0.0005) * 4)).toString()}`;
      ctx.fillText(freqText, 8, yCenter - halfHeight + 36);

      if (isSpiking) {
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = `rgba(255, 50, 50, ${0.5 + spike.intensity * 0.5})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff0000";
        ctx.fillText("!! SIGNAL DETECTED !!", 8, yCenter + halfHeight - 8);
      }

      ctx.restore();
    }

    function draw() {
      if (!ctx) return;

      // Generate multiple samples per frame for faster scrolling
      const samplesPerFrame = 3;
      for (let i = 0; i < samplesPerFrame; i++) {
        generateSamples();
      }

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillRect(0, 0, width, height);

      // Draw scanline effect
      ctx.save();
      ctx.fillStyle = "rgba(0, 255, 65, 0.008)";
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();

      const channelHeight = height / 3;

      // Draw separator lines between channels
      ctx.strokeStyle = "#00ff4115";
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, channelHeight * i);
        ctx.lineTo(width, channelHeight * i);
        ctx.stroke();
      }

      // Draw each channel
      for (let i = 0; i < 3; i++) {
        const yCenter = channelHeight * i + channelHeight / 2;
        const buffer = i === 0 ? bufferA : i === 1 ? bufferB : bufferC;
        drawChannel(i, buffer, CHANNELS[i], yCenter, channelHeight);
      }

      // Draw top header bar
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, width, 18);
      ctx.font = "9px monospace";
      ctx.fillStyle = "#00ff4166";
      ctx.shadowBlur = 2;
      ctx.shadowColor = "#00ff41";

      const now = new Date();
      const timeStr = now.toISOString().replace("T", " ").substring(0, 19);
      ctx.fillText(
        `SIGINT MONITOR v2.7.1 | ${timeStr} UTC | ACTIVE CHANNELS: 3 | STATUS: RECORDING`,
        8,
        13
      );

      // Right-aligned frame counter
      const frameText = `FRM: ${bufferWriteIndex.toString().padStart(8, "0")}`;
      const frameWidth = ctx.measureText(frameText).width;
      ctx.fillText(frameText, width - frameWidth - 8, 13);
      ctx.restore();

      // Draw border
      ctx.strokeStyle = "#00ff4120";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);

      animationId = requestAnimationFrame(draw);
    }

    // Resize handling
    function handleResize() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);
    handleResize();

    // Pre-fill some buffer so the waveform isn't empty on first render
    for (let i = 0; i < BUFFER_SIZE; i++) {
      generateSamples();
    }

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden", background: "#000" }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block" }}
      />
    </div>
  );
}
