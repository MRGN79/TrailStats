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

export interface ShareCardData {
  category: string;
  subcategory?: string;
  mainValue: string;
  unit?: string;
  detail?: string;
}

async function ensureFonts(): Promise<void> {
  await Promise.allSettled([
    document.fonts.load('bold 160px "JetBrains Mono"'),
    document.fonts.load('bold 36px "Space Grotesk"'),
    document.fonts.load('600 24px "Space Grotesk"'),
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
    ctx.ellipse(W * 0.72, H * 0.3, 90 + i * 62, 58 + i * 42, -0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(W * 0.2, H * 0.8, 75 + i * 55, 48 + i * 38, 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAccentBar(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.ember;
  ctx.fillRect(80, 72, 76, 6);
}

function drawBrand(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.font = 'bold 34px "Space Grotesk", system-ui, sans-serif';
  const trail = "Trail";
  const stats = "Stats";
  const trailW = ctx.measureText(trail).width;
  const totalW = ctx.measureText(trail + stats).width;
  const x = W - 80 - totalW;
  const y = H - 52;
  ctx.fillStyle = "rgba(250,248,243,0.92)";
  ctx.fillText(trail, x, y);
  ctx.fillStyle = C.ember;
  ctx.fillText(stats, x + trailW, y);
  ctx.restore();
}

function drawTagline(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.font = '400 15px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = "rgba(250,248,243,0.26)";
  ctx.textAlign = "right";
  ctx.fillText("trailstats", W - 80, H - 24);
  ctx.restore();
}

function autoFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  family: string
): number {
  const candidates = [200, 180, 160, 140, 120, 100, 88, 76];
  for (const size of candidates) {
    ctx.font = `bold ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return 76;
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  drawBg(ctx);
  drawTopo(ctx);
  drawAccentBar(ctx);

  const PAD = 80;
  const monoFamily = '"JetBrains Mono", ui-monospace, "SFMono-Regular", monospace';
  const displayFamily = '"Space Grotesk", system-ui, sans-serif';

  // Category label — small, faint, uppercase
  ctx.font = `600 22px ${displayFamily}`;
  ctx.fillStyle = C.paperFaint;
  ctx.fillText(data.category.toUpperCase(), PAD, 175);

  // Subcategory — medium, moss accent
  if (data.subcategory) {
    ctx.font = `bold 44px ${displayFamily}`;
    ctx.fillStyle = C.moss;
    ctx.fillText(data.subcategory, PAD, 248);
  }

  // Main value — auto-sized, white, mono
  const mainSize = autoFontSize(ctx, data.mainValue, W - PAD * 2, monoFamily);
  ctx.font = `bold ${mainSize}px ${monoFamily}`;
  ctx.fillStyle = C.paper;
  ctx.fillText(data.mainValue, PAD, 490);

  // Unit — below main value, moss
  if (data.unit) {
    ctx.font = `500 36px ${displayFamily}`;
    ctx.fillStyle = C.moss;
    ctx.fillText(data.unit, PAD, 548);
  }

  // Divider
  ctx.strokeStyle = C.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 638);
  ctx.lineTo(W - PAD, 638);
  ctx.stroke();

  // Detail text
  if (data.detail) {
    ctx.font = `400 26px ${displayFamily}`;
    ctx.fillStyle = C.paperFaint;
    ctx.fillText(data.detail, PAD, 694);
  }

  drawBrand(ctx);
  drawTagline(ctx);

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
