import {
  Crop,
  Film,
  Frame,
  Monitor,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  Square,
} from "lucide-react";

export const ratios = [
  {
    label: "Square (1:1)",
    value: 1,
    aspectRatio: "1:1",
    icon: Square,
    desc: "Instagram Feed",
  },
  {
    label: "Wide (16:9)",
    value: 16 / 9,
    aspectRatio: "16:9",
    icon: Monitor,
    desc: "YouTube / Video",
  },
  {
    label: "Standard (4:3)",
    value: 4 / 3,
    aspectRatio: "4:3",
    icon: RectangleHorizontal,
    desc: "Classic Camera",
  },
  {
    label: "Classic (3:2)",
    value: 3 / 2,
    aspectRatio: "3:2",
    icon: Frame,
    desc: "DSLR / Print",
  },
  {
    label: "Cinema (21:9)",
    value: 21 / 9,
    aspectRatio: "21:9",
    icon: Film,
    desc: "Ultrawide",
  },
  {
    label: "Story (9:16)",
    value: 9 / 16,
    aspectRatio: "9:16",
    icon: Smartphone,
    desc: "TikTok / Reels",
  },
  {
    label: "Social (4:5)",
    value: 4 / 5,
    aspectRatio: "4:5",
    icon: Crop,
    desc: "Insta Portrait",
  },
  {
    label: "Poster (2:3)",
    value: 2 / 3,
    aspectRatio: "2:3",
    icon: RectangleVertical,
    desc: "Pinterest",
  },
];

export const filters = [
  {
    id: "cartoon",
    name: "Toonify",
    prompt:
      "Redraw the entire image as a vibrant 2D cartoon. Apply bold black outlines, flat coloring, and cel-shading globally to both the subject and the background. Simplify details into a clean comic book style.",
    image: "/filters/toonify.png",
  },
  {
    id: "ghibli",
    name: "Ghibli Studio",
    prompt:
      "Transform the whole image into a Studio Ghibli anime scene. Redraw everything with hand-painted backgrounds, vibrant natural greens and blues, fluffy clouds, and cel-shaded characters. Maintain the original composition but strictly enforce the Hayao Miyazaki art style.",
    image: "/filters/ghibli.png",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    prompt:
      "Apply a global Cyberpunk 2077 aesthetic. Shift the entire color palette to neon cyan, magenta, and deep black. Add a futuristic glow, rain reflections, and high-tech digital artifacts to the whole scene.",
    image: "/filters/cyberpunk.png",
  },
  {
    id: "oil_painting",
    name: "Oil Painting",
    prompt:
      "Re-imagine this image as a classic oil painting on canvas. Apply heavy, visible brushstrokes and rich impasto textures across the entire surface. Blend colors like an Impressionist master (Van Gogh style). Remove all photorealistic sharpness.",
    image: "/filters/oilpainting.png",
  },
];

export enum ToolType {
  MOVE = "MOVE",
  RECTANGLE = "RECTANGLE",
  BRUSH = "BRUSH",
  ERASER = "ERASER",
  CROP = "CROP",
  TEXT = "TEXT",
  COLOR_PICKER = "COLOR_PICKER",
  SMART_REMOVE = "SMART_REMOVE",
  PEN = "PEN",
}

export const PROMPT_TEMPLATES = [
  { label: "Golden Hour", prompt: "Transform the lighting to a warm golden hour sunset. Soft orange and pink tones, long shadows, glowing highlights on surfaces." },
  { label: "Add Rain", prompt: "Add heavy rain effect to the scene. Streaking rain drops, wet surfaces with reflections, moody overcast atmosphere." },
  { label: "Pencil Sketch", prompt: "Convert this image to a detailed pencil sketch. Clean graphite lines, cross-hatching for shadows, white paper background." },
  { label: "Neon Night", prompt: "Transform to a neon-lit night scene. Vivid neon signs reflecting off wet streets, dark atmosphere with glowing cyan and magenta lights." },
  { label: "Cinematic", prompt: "Apply cinematic color grading with widescreen letterbox bars. Film grain, lifted shadows, warm highlight tones, desaturated midtones." },
  { label: "Soft Portrait", prompt: "Apply a soft focus portrait effect. Gentle bokeh background blur, smooth skin tones, dreamy ethereal quality with warm light." },
  { label: "Vintage Film", prompt: "Apply vintage film photography effect. Faded colors, light leaks, visible grain, slight vignette, warm brownish tones." },
  { label: "Snow Scene", prompt: "Add realistic snowfall to the scene. Snowflakes mid-air, snow accumulation on surfaces, cold blue-white ambient light." },
];

export const STICKER_CATEGORIES: Record<string, string[]> = {
  Faces: ["😀", "😂", "😍", "🤩", "😎", "🥳", "😭", "🔥"],
  Nature: ["🌸", "🌊", "⚡", "🌙", "⭐", "🌈", "🍀", "🌺"],
  Objects: ["❤️", "💎", "🎉", "🎨", "🏆", "🎵", "🚀", "💡"],
  Symbols: ["✨", "💫", "🔮", "👑", "💯", "🎯", "🌟", "💥"],
};
