import { formatDistance, formatDuration, formatNumber } from "./format";

const W = 1080;
const H = 1080;

const C = {
  bg: "#16271e",
  paper: "#faf8f3",
  paperFaint: "rgba(250,248,243,0.32)",
  moss: "#3f7d5a",
  ember: "#fc5200",
  topo: "rgba(255,255,255,0.04)",
  divider: "rgba(255,255,255,0.14)",
} as const;

export interface SummaryCardData {
  totalActivities: number;
  totalDistanceKm: number;
  totalMovingTimeSec: number;
  totalElevationGainM: number;
  currentStreak: number;
  bestWeekDistanceKm: number | null;
  locale: string;
  labels: {
    activities: string;
    distance: string;
    time: string;
    elevation: string;
    currentStreak: string;
    bestWeek: string;
    weeks: string;
    km: string;
    m: string;
  };
}

async function ensureFonts(): Promise<void> {
  await Promise.allSettled([
    document.fonts.load('bold 72px "JetBrains Mono"'),
    document.fonts.load('bold 34px "Space Grotesk"'),
    document.fonts.load('600 22px "Space Grotesk"'),
    document.fonts.load('400 26px "Space Grotesk"'),
  ]);
}

function drawBg(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
}

function drawTopo(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = C.topo;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(W * 0.78, H * 0.22, 90 + i * 62, 58 + i * 42, -0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(W * 0.18, H * 0.82, 75 + i * 55, 48 + i * 38, 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrand(ctx: CanvasRenderingContext2D): void {
  const displayFamily = '"Space Grotesk", system-ui, sans-serif';
  ctx.save();
  ctx.font = `bold 34px ${displayFamily}`;
  const trail = "Trail";
  const stats = "Stats";
  const trailW = ctx.measureText(trail).width;
  const totalW = ctx.measureText(trail + stats).width;
  const x = W - 80 - totalW;
  const y = H - 48;
  ctx.fillStyle = "rgba(250,248,243,0.92)";
  ctx.fillText(trail, x, y);
  ctx.fillStyle = C.ember;
  ctx.fillText(stats, x + trailW, y);
  ctx.restore();
}

function drawAccentBar(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.ember;
  ctx.fillRect(80, 72, 76, 6);
}

function drawSummaryGrid(ctx: CanvasRenderingContext2D, data: SummaryCardData): void {
  const { locale, labels } = data;
  const monoFamily = '"JetBrains Mono", ui-monospace, "SFMono-Regular", monospace';
  const displayFamily = '"Space Grotesk", system-ui, sans-serif';

  const cells: Array<{ value: string; unit: string; label: string }> = [
    {
      value: formatNumber(data.totalActivities, locale),
      unit: "",
      label: labels.activities,
    },
    {
      value: formatDistance(data.totalDistanceKm, locale),
      unit: labels.km,
      label: labels.distance,
    },
    {
      value: formatDuration(data.totalMovingTimeSec, locale),
      unit: "",
      label: labels.time,
    },
    {
      value: formatNumber(data.totalElevationGainM, locale),
      unit: labels.m,
      label: labels.elevation,
    },
    {
      value: String(data.currentStreak),
      unit: labels.weeks,
      label: labels.currentStreak,
    },
    {
      value: data.bestWeekDistanceKm != null
        ? formatDistance(data.bestWeekDistanceKm, locale)
        : "—",
      unit: data.bestWeekDistanceKm != null ? labels.km : "",
      label: labels.bestWeek,
    },
  ];

  const PAD = 80;
  const gridTop = 160;
  const gridBottom = H - 100;
  const cols = 2;
  const rows = 3;
  const cellW = (W - PAD * 2) / cols;
  const cellH = (gridBottom - gridTop) / rows;

  cells.forEach((cell, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAD + col * cellW;
    const y = gridTop + row * cellH;

    // Dividers
    ctx.strokeStyle = C.divider;
    ctx.lineWidth = 1;
    if (col === 0) {
      ctx.beginPath();
      ctx.moveTo(x + cellW, y + 24);
      ctx.lineTo(x + cellW, y + cellH - 24);
      ctx.stroke();
    }
    if (row < rows - 1 && col === 0) {
      ctx.beginPath();
      ctx.moveTo(PAD, y + cellH);
      ctx.lineTo(W - PAD, y + cellH);
      ctx.stroke();
    }

    const cx = x + cellW / 2;
    const valueY = y + cellH * 0.38;
    const unitY = y + cellH * 0.6;
    const labelY = y + cellH * 0.8;

    // Value
    ctx.fillStyle = C.paper;
    ctx.font = `bold 72px ${monoFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Shrink font if too wide
    let fontSize = 72;
    while (ctx.measureText(cell.value).width > cellW - 32 && fontSize > 36) {
      fontSize -= 6;
      ctx.font = `bold ${fontSize}px ${monoFamily}`;
    }
    ctx.fillText(cell.value, cx, valueY);

    // Unit
    if (cell.unit) {
      ctx.fillStyle = C.moss;
      ctx.font = `600 26px ${displayFamily}`;
      ctx.fillText(cell.unit, cx, unitY);
    }

    // Label
    ctx.fillStyle = C.paperFaint;
    ctx.font = `400 22px ${displayFamily}`;
    ctx.fillText(cell.label.toUpperCase(), cx, labelY);
  });
}

export async function generateSummaryCard(data: SummaryCardData): Promise<Blob> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  drawBg(ctx);
  drawTopo(ctx);
  drawAccentBar(ctx);
  drawSummaryGrid(ctx, data);
  drawBrand(ctx);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob failed"));
      },
      "image/png"
    );
  });
}
