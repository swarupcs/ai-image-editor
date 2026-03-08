export type Point = {
  x: number;
  y: number;
};

export type TextLayer = {
  id: string;
  text: string;
  x: number; // percentage of canvas width (0-1)
  y: number; // percentage of canvas height (0-1)
  fontSize: number;
  color: string;
  fontFamily: string;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Adjustments = {
  brightness: number; // 100 = normal
  contrast: number;
  saturation: number;
};
