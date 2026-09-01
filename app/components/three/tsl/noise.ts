import { Fn, dot, float, fract, mix, sin, vec2 } from "three/tsl";

export const hash = Fn(([p]: [any]) => {
  return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
});

export const noise2d = Fn(([p]: [any]) => {
  const i = vec2(p.x.floor(), p.y.floor());
  const f = vec2(fract(p.x), fract(p.y));
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));
  const a = hash(i);
  const b = hash(i.add(vec2(1, 0)));
  const c = hash(i.add(vec2(0, 1)));
  const d = hash(i.add(vec2(1, 1)));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});

export const fbm = Fn(([p]: [any]) => {
  const o1 = noise2d(p).mul(0.5);
  const o2 = noise2d(p.mul(2.0).add(3.7)).mul(0.25);
  const o3 = noise2d(p.mul(4.0).add(7.3)).mul(0.125);
  const o4 = noise2d(p.mul(8.0).add(13.1)).mul(0.0625);
  return o1.add(o2).add(o3).add(o4);
});

/** Lightweight 2-octave FBM for transition shaders */
export const fbmLight = Fn(([p]: [any]) => {
  const o1 = noise2d(p).mul(0.65);
  const o2 = noise2d(p.mul(2.0).add(3.7)).mul(0.35);
  return o1.add(o2);
});
