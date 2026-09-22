"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo animado da skin "Arena Real": campo gramado com muralhas, torres,
 * bandeiras balançando, tocha acesa e partículas subindo. Desenhado via
 * Canvas 2D (não CSS) porque a perspectiva do gramado e a grama individual
 * balançando exigem milhares de formas pequenas por quadro -- inviável em
 * DOM/CSS sem travar a página. Adaptado do protótipo validado com o usuário
 * num Artifact antes de virar este componente; mantém o desenho em espaço
 * fixo 960x540 e escala via canvas.width/height, como no original.
 */
export function ClashArenaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const context = canvasEl?.getContext("2d");
    if (!canvasEl || !context) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const c: CanvasRenderingContext2D = context;

    let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let time = 0;
    let last = 0;
    let raf = 0;

    type Fill = string | CanvasGradient;

    function poly(points: [number, number][], fill: Fill, stroke?: string) {
      c!.beginPath();
      points.forEach((p, i) => (i ? c!.lineTo(...p) : c!.moveTo(...p)));
      c!.closePath();
      c!.fillStyle = fill;
      c!.fill();
      if (stroke) {
        c!.strokeStyle = stroke;
        c!.lineWidth = 1;
        c!.stroke();
      }
    }
    function rect(x: number, y: number, w: number, h: number, fill: Fill) {
      c!.fillStyle = fill;
      c!.fillRect(x, y, w, h);
    }
    function glow(x: number, y: number, r: number, color: string) {
      const g = c!.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      c!.fillStyle = g;
      c!.fillRect(x - r, y - r, r * 2, r * 2);
    }
    function block(x: number, y: number, w: number, h: number, col: string) {
      c!.fillStyle = "#12243c";
      c!.beginPath();
      c!.roundRect(x, y, w, h, 4);
      c!.fill();
      c!.fillStyle = col;
      c!.beginPath();
      c!.roundRect(x + 2, y + 2, w - 4, h - 5, 3);
      c!.fill();
      rect(x + 5, y + 3, w - 10, 2, "#9aaac244");
      rect(x + 4, y + h - 7, w - 8, 3, "#14233955");
    }
    function tower(x: number) {
      rect(x, 140, 95, 245, "#283c55");
      for (let r = 0; r < 8; r++)
        for (let k = 0; k < 3; k++)
          block(x + k * 32 - (r % 2) * 10, 144 + r * 29, 32, 29, ["#415773", "#4a617d", "#3f526c"][(k + r) % 3]);
      block(x - 9, 135, 113, 24, "#657a94");
      for (let n = 0; n < 3; n++) block(x - 8 + n * 41, 109, 31, 36, "#70839c");
      block(x - 10, 363, 116, 23, "#64738a");
      rect(x + 38, 184, 18, 46, "#10233d");
      rect(x + 41, 187, 4, 37, "#233b5b");
    }
    function flag(x: number, y: number, col: number, phase: number) {
      rect(x - 4, y - 16, 7, 165, "#9c723d");
      rect(x - 2, y - 16, 2, 165, "#efd292");
      glow(x, y - 13, 9, "#e6b75533");
      poly(
        [
          [x, y - 25],
          [x - 8, y - 13],
          [x, y - 3],
          [x + 8, y - 13],
        ],
        "#efc974",
      );
      const width = 67;
      const height = 106;
      for (let i = 0; i < width; i++) {
        const wave = Math.sin(time * 1.5 + i * 0.07 + phase) * (i / width) * 7;
        const shade = Math.floor(35 + Math.sin(i * 0.09 + time * 1.5 + phase) * 10);
        rect(x + i, y + wave, 1.5, height - i * 0.25, `hsl(${col},75%,${shade}%)`);
        rect(x + i, y + wave + height - i * 0.25 - 4, 1.5, 4, "#d7b160");
      }
      c!.save();
      c!.translate(x + 34, y + 46 + Math.sin(time * 1.5 + phase + 2) * 3);
      poly(
        [
          [-15, -9],
          [-8, -3],
          [0, -16],
          [8, -3],
          [15, -9],
          [11, 12],
          [-11, 12],
        ],
        "#f3d27d",
      );
      rect(-11, 15, 22, 4, "#c99843");
      c!.restore();
    }
    function torch(x: number, y: number) {
      glow(x, y - 15, 72, "#ff9c2333");
      rect(x - 5, y, 10, 36, "#372b29");
      poly(
        [
          [x - 15, y - 4],
          [x + 15, y - 4],
          [x + 9, y + 13],
          [x - 9, y + 13],
        ],
        "#af824d",
      );
      for (let n = 0; n < 3; n++) {
        c!.save();
        c!.translate(x, y - 6);
        c!.scale(1, 1 + 0.12 * Math.sin(time * 7 + n));
        c!.beginPath();
        c!.moveTo(-11 + n * 3, 0);
        c!.bezierCurveTo(-19, -18, 5 + Math.sin(time * 5) * 5, -24, 0, -44 + n * 8);
        c!.bezierCurveTo(25, -15, 13, -2, 9 - n * 3, 0);
        c!.fillStyle = ["#fa672c", "#ffa735", "#ffe38a"][n];
        c!.fill();
        c!.restore();
      }
    }
    function draw() {
      c!.setTransform(canvas.width / 960, 0, 0, canvas.height / 540, 0, 0);
      const sky = c!.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, "#112643");
      sky.addColorStop(0.52, "#426388");
      sky.addColorStop(1, "#1e3445");
      rect(0, 0, 960, 540, sky);
      glow(480, 150, 290, "#9cbeed25");

      for (let j = 0; j < 3; j++) {
        const yy = 130 + j * 35;
        const pts: [number, number][] = [
          [0, 320],
          [0, yy + 50],
        ];
        for (let i = 0; i < 13; i++) pts.push([i * 85, yy + Math.sin(i * 2 + j) * 30]);
        pts.push([960, 320]);
        poly(pts, ["#304968", "#2d4863", "#2a4259"][j]);
      }
      for (let i = 0; i < 55; i++) {
        const x = (i * 173.53) % 960;
        const y = (i * 57.7) % 175;
        glow(x, y, 1.5, "#dbe7fc55");
      }

      rect(0, 249, 960, 115, "#263c54");
      for (let r = 0; r < 4; r++)
        for (let k = -1; k < 20; k++)
          block(k * 54 + (r % 2) * 27, 250 + r * 28, 54, 28, ["#455c74", "#3f546c", "#4a6078"][(k + r + 24) % 3]);
      for (let k = 0; k < 20; k++) block(k * 52, 229, 32, 32, "#5b7087");
      rect(0, 265, 960, 10, "#687a8e");

      const turf = c!.createLinearGradient(0, 355, 0, 540);
      turf.addColorStop(0, "#365e35");
      turf.addColorStop(0.4, "#54863e");
      turf.addColorStop(1, "#426e32");
      rect(0, 358, 960, 182, turf);

      const grassRows = [358, 377, 402, 436, 481, 540];
      for (let r = 0; r < grassRows.length - 1; r++) {
        const y1 = grassRows[r];
        const y2 = grassRows[r + 1];
        const s1 = 1 + (y1 - 358) / 250;
        const s2 = 1 + (y2 - 358) / 250;
        for (let k = -8; k < 9; k++) {
          const x = k * 65;
          poly(
            [
              [480 + x * s1, y1],
              [480 + (x + 65) * s1, y1],
              [480 + (x + 65) * s2, y2],
              [480 + x * s2, y2],
            ],
            (k + r) % 2 === 0 ? "#b2cf6220" : "#244e2315",
          );
        }
      }
      for (let i = 0; i < 820; i++) {
        const x = (i * 97.173) % 960;
        const y = 363 + ((i * 31.371) % 177);
        const depth = (y - 358) / 182;
        const h = 2 + depth * 5;
        const sway = Math.sin(time * 1.2 + x * 0.016 + y * 0.012) * depth * 1.8;
        poly(
          [
            [x, y],
            [x + 1 + sway, y - h],
            [x + 2, y - 1],
            [x + 4 + sway, y - h * 0.7],
            [x + 4, y + 1],
          ],
          ["#8fad5b77", "#365c3277", "#a3bd5c66", "#628d4566"][i % 4],
        );
      }

      const wallShadow = c!.createLinearGradient(0, 358, 0, 389);
      wallShadow.addColorStop(0, "#15251d88");
      wallShadow.addColorStop(1, "transparent");
      rect(0, 358, 960, 31, wallShadow);

      tower(14);
      tower(851);
      flag(62, 151, 216, 0);
      flag(833, 151, 353, 1.8);
      torch(160, 326);
      torch(800, 326);

      const shade = c!.createRadialGradient(480, 310, 70, 480, 300, 560);
      shade.addColorStop(0, "#0b173500");
      shade.addColorStop(0.6, "#08183111");
      shade.addColorStop(1, "#041028aa");
      rect(0, 0, 960, 540, shade);

      for (let i = 0; i < 48; i++) {
        const p = (time * 0.035 + i * 0.618) % 1;
        const x = (i * 137.3) % 940 + 10 + Math.sin(time * 0.6 + i) * 12;
        const y = 520 - p * 440;
        const a = Math.sin(p * Math.PI) * 0.6;
        c!.globalAlpha = a;
        glow(x, y, 4, i % 3 ? "#ffe4a0" : "#94dfff");
        rect(x - 1, y - 1, 2, 2, i % 3 ? "#ffeac0" : "#b9f1ff");
        c!.globalAlpha = 1;
      }
    }

    function resize() {
      const rectBounds = canvas.getBoundingClientRect();
      const width = Math.max(320, rectBounds.width);
      const height = Math.max(180, rectBounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw();
    }
    function tick(now: number) {
      if (!canvas.isConnected) return;
      if (!paused) {
        time += Math.min((now - last) / 1000 || 0, 0.05);
        draw();
      }
      last = now;
      raf = requestAnimationFrame(tick);
    }

    const reduceMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      paused = reduceMotionQuery.matches;
    };
    reduceMotionQuery.addEventListener("change", onMotionChange);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      reduceMotionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      aria-label="Arena medieval animada com campo gramado, muralhas, bandeiras e tochas"
      role="img"
    />
  );
}
