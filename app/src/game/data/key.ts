const atlas = {
  player: "player",
} as const;

const image = {
  interiors: "interiors",
  rooms: "rooms",
} as const;

const scene = {
  boot: "boot",
  main: "main",
} as const;

const tilemap = {
  main: "main",
} as const;

export const key = {
  atlas,
  image,
  scene,
  tilemap,
} as const;
