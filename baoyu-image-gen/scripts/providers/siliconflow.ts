import { CliArgs } from "../types";

export function getDefaultModel(): string {
  return process.env.SILICONFLOW_IMAGE_MODEL || "Kwai-Kolors/Kolors";
}

function parseAspectRatio(ar: string): { width: number; height: number } | null {
  const match = ar.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const width = parseFloat(match[1]!);
  const height = parseFloat(match[2]!);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function resolveImageSize(args: CliArgs): string {
  if (args.size) return args.size;
  const parsed = args.aspectRatio ? parseAspectRatio(args.aspectRatio) : null;
  if (!parsed) return "1024x1024";
  const ratio = parsed.width / parsed.height;
  if (Math.abs(ratio - 1) < 0.05) return "1024x1024";
  if (ratio > 1) return "1664x928";
  return "928x1664";
}

function resolveBatchSize(n: number): number {
  const clamp = Math.max(1, Math.min(4, Math.round(n)));
  return clamp;
}

function resolveGuidanceScale(args: CliArgs): number {
  if (args.quality === "2k") return 8;
  return 7.5;
}

export async function generateImage(prompt: string, model: string, args: CliArgs): Promise<Uint8Array> {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    throw new Error("SILICONFLOW_API_KEY is required for siliconflow image generation.");
  }

  const baseURL = process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1";
  const payload = {
    model,
    prompt,
    image_size: resolveImageSize(args),
    batch_size: resolveBatchSize(args.n),
    num_inference_steps: 20,
    guidance_scale: resolveGuidanceScale(args),
  } as Record<string, unknown>;

  const res = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SiliconFlow API error: ${err}`);
  }

  const data = (await res.json()) as { images?: Array<{ url?: string }> };
  const url = data.images?.[0]?.url;
  if (!url) {
    throw new Error(`SiliconFlow API returned no image URL: ${JSON.stringify(data)}`);
  }

  const download = await fetch(url);
  if (!download.ok) {
    const err = await download.text();
    throw new Error(`Failed to download SiliconFlow image: ${err}`);
  }

  const buffer = await download.arrayBuffer();
  return Uint8Array.from(Buffer.from(buffer));
}
