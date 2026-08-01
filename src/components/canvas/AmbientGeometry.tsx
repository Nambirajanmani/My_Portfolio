'use client';

import React, { useEffect, useRef } from 'react';

interface NodeItem {
  x: number;
  y: number;
  z: number; // depth 0–1 (0 = far, 1 = close)
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  pulseOffset: number; // for breathing effect
}

interface GeoShape {
  x: number;
  y: number;
  z: number;
  rotation: number;
  vRotation: number;
  size: number;
  sides: number; // 3 = triangle, 6 = hexagon
  opacity: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const CYAN = hexToRgb('#00b4d8');   // close nodes
const INDIGO = hexToRgb('#6366f1'); // far nodes
const ACCENT = hexToRgb('#48cae4'); // lines

export default function AmbientGeometry() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const animationFrameRef = useRef<number | null>(null);
  const nodesRef = useRef<NodeItem[]>([]);
  const shapesRef = useRef<GeoShape[]>([]);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas?.getContext('2d') || null;
    } catch {
      return;
    }
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let isMobile = false;

    const initNodes = () => {
      isMobile = window.innerWidth < 768;
      const count = isMobile ? 50 : 110;
      const nodes: NodeItem[] = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random(),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          vz: (Math.random() - 0.5) * 0.003,
          radius: 1.2 + Math.random() * 1.4,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
      nodesRef.current = nodes;

      const shapeCount = isMobile ? 4 : 8;
      const geos: GeoShape[] = [];
      for (let i = 0; i < shapeCount; i++) {
        geos.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random(),
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.006,
          size: 18 + Math.random() * 28,
          sides: Math.random() > 0.5 ? 6 : 3,
          opacity: 0.04 + Math.random() * 0.06,
        });
      }
      shapesRef.current = geos;
    };

    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width;
      canvas.height = height;
      initNodes();
    };

    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => resizeCanvas(), 200);
    };
    resizeCanvas();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, active: false };
    };

    const parentSection = containerRef.current?.parentElement ?? null;
    if (parentSection) {
      parentSection.addEventListener('mousemove', handleMouseMove);
      parentSection.addEventListener('mouseleave', handleMouseLeave);
    }

    // Draw a regular polygon
    const drawPolygon = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      sides: number,
      size: number,
      rotation: number,
      color: string,
    ) => {
      c.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = rotation + (i / sides) * Math.PI * 2;
        const px = cx + Math.cos(angle) * size;
        const py = cy + Math.sin(angle) * size;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.strokeStyle = color;
      c.lineWidth = 0.8;
      c.stroke();
    };

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const shapes = shapesRef.current;
      const mouse = mouseRef.current;

      // ── Draw geometric shapes ──
      for (const shape of shapes) {
        shape.rotation += shape.vRotation;
        // depth-based scale
        const scale = lerp(0.4, 1.2, shape.z);
        const [cr, cg, cb] = ACCENT;
        drawPolygon(
          ctx,
          shape.x,
          shape.y,
          shape.sides,
          shape.size * scale,
          shape.rotation,
          `rgba(${cr},${cg},${cb},${shape.opacity})`,
        );
      }

      // ── Draw connecting lines ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = isMobile ? 90 : 130;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const avgZ = (n1.z + n2.z) / 2;
            const alpha = (1 - dist / maxDist) * lerp(0.04, 0.18, avgZ);
            const [lr, lg, lb] = ACCENT;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
            ctx.lineWidth = lerp(0.3, 0.9, avgZ);
            ctx.stroke();
          }
        }
      }

      // ── Draw nodes ──
      for (const node of nodes) {
        // Mouse repulsion
        if (!isMobile && mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140 && dist > 1) {
            const strength = ((140 - dist) / 140) * 0.9;
            node.vx += (dx / dist) * strength;
            node.vy += (dy / dist) * strength;
          }
        }

        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Damp velocity
        node.vx *= 0.983;
        node.vy *= 0.983;

        // Clamp Z
        if (node.z < 0) { node.z = 0; node.vz *= -1; }
        if (node.z > 1) { node.z = 1; node.vz *= -1; }

        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        const minSpeed = 0.1;
        if (speed < minSpeed && speed > 0.001) {
          const scale = minSpeed / speed;
          node.vx *= scale;
          node.vy *= scale;
        } else if (speed < 0.001) {
          node.vx = (Math.random() - 0.5) * 0.15;
          node.vy = (Math.random() - 0.5) * 0.15;
        }
        const maxSpeed = 2.8;
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
        }

        // Bounce walls
        if (node.x <= 0)      { node.x = 0;     node.vx = Math.abs(node.vx) * 0.7; }
        else if (node.x >= width)  { node.x = width;  node.vx = -Math.abs(node.vx) * 0.7; }
        if (node.y <= 0)      { node.y = 0;     node.vy = Math.abs(node.vy) * 0.7; }
        else if (node.y >= height) { node.y = height; node.vy = -Math.abs(node.vy) * 0.7; }

        // Depth-based color interpolation: far=indigo, close=cyan
        const [cr, cg, cb] = [
          Math.round(lerp(INDIGO[0], CYAN[0], node.z)),
          Math.round(lerp(INDIGO[1], CYAN[1], node.z)),
          Math.round(lerp(INDIGO[2], CYAN[2], node.z)),
        ];

        // Breathing pulse
        const pulse = Math.sin(t * 1.8 + node.pulseOffset) * 0.4;
        const drawRadius = (node.radius + pulse) * lerp(0.5, 1.4, node.z);

        // Glow for close nodes
        if (node.z > 0.65) {
          const glowAlpha = lerp(0, 0.25, (node.z - 0.65) / 0.35);
          const grd = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, drawRadius * 4,
          );
          grd.addColorStop(0, `rgba(${cr},${cg},${cb},${glowAlpha})`);
          grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.beginPath();
          ctx.arc(node.x, node.y, drawRadius * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Core dot
        const dotAlpha = lerp(0.25, 0.85, node.z);
        ctx.beginPath();
        ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${dotAlpha})`;
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (parentSection) {
        parentSection.removeEventListener('mousemove', handleMouseMove);
        parentSection.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
