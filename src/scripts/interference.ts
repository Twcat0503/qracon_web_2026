

const VERT =  `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG =  `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uA;
uniform vec2 uB;
uniform vec3 uP;
uniform float uCollapse;
uniform float uDpr;
uniform float uStrip;
uniform float uAge;

out vec4 outColor;

const float TAU = 6.283185307179586;
const float PAPER = 0.6938;
const float FRONT_SPEED = 900.0;
const float FRONT_SOFT = 160.0;

float reached(vec2 p) {
  float d = min(distance(p, uA), distance(p, uB));
  float r = uAge * FRONT_SPEED * uDpr;
  return 1.0 - smoothstep(r - FRONT_SOFT * uDpr, r, d);
}

void accum(vec2 p, vec2 s, float weight, float k, float w, inout vec2 f, inout float n) {
  float r = distance(p, s);
  float a = weight * inversesqrt(1.0 + r / (90.0 * uDpr));
  float ph = k * r - w;
  f += a * vec2(cos(ph), sin(ph));
  n += a;
}

vec2 field(vec2 p, float k, float w) {
  vec2 f = vec2(0.0);
  float n = 0.0;
  accum(p, uA, 1.0, k, w, f, n);
  accum(p, uB, 1.0, k, w, f, n);
  accum(p, uP.xy, uP.z, k, w, f, n);
  n = max(n, 1e-4);
  return vec2(f.x / n, dot(f, f) / (n * n));
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash2(vec2 p) {
  return vec2(hash(p), hash(p + 17.31));
}

float srgb(float l) {
  return l <= 0.0031308 ? 12.92 * l : 1.055 * pow(l, 1.0 / 2.4) - 0.055;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  float k = TAU / (14.0 * uDpr);
  float w = uTime * 2.4;
  float c = uCollapse;
  float ink = 0.0;

  if (p.y > uStrip) {
    float d = min(distance(p, uA), distance(p, uB));
    float env = mix(0.28, 1.0, exp(-d / (700.0 * uDpr))) * reached(p);

    if (c < 0.999) {
      vec2 fw = field(p, k, w);
      float crest = smoothstep(0.3, 0.85, fw.x);
      float fringe = 0.14 * fw.y;
      ink = (crest * mix(0.25, 1.0, fw.y) * 0.46 + fringe) * env * (1.0 - c);
    }

    if (c > 0.001) {
      float cell = 4.5 * uDpr;
      vec2 id = floor(p / cell);
      vec2 centre = (id + 0.25 + 0.5 * hash2(id)) * cell;
      float I = field(centre, k, 0.0).y;
      float hit = step(hash(id + 3.7), I * c * 0.9 * env);
      float r = 0.95 * uDpr;
      float dotMask = 1.0 - smoothstep(r - 0.7, r + 0.7, distance(p, centre));
      ink = max(ink, dotMask * hit * 0.92);
    }
  } else {
    float base = uStrip * 0.2;
    float span = uStrip * 0.62;
    float yLine = uStrip + 18.0 * uDpr;

    float seen = reached(vec2(p.x, yLine));
    float I = field(vec2(p.x, yLine), k, 0.0).y * seen;
    float curve = base + span * I;
    float line = 1.0 - smoothstep(0.6 * uDpr, 1.6 * uDpr, abs(p.y - curve));

    float bin = 5.0 * uDpr;
    float bx = (floor(p.x / bin) + 0.5) * bin;
    float Ib = field(vec2(bx, yLine), k, 0.0).y * seen;
    float bar = step(p.y, base + span * Ib * c) * step(base, p.y) * step(fract(p.x / bin), 0.66);

    float baseline = 1.0 - smoothstep(0.4 * uDpr, 1.2 * uDpr, abs(p.y - base));
    float tick = step(mod(p.x, 32.0 * uDpr), 1.25 * uDpr) * step(p.y, base) * step(base - 5.0 * uDpr, p.y);

    ink = max(max(line * (1.0 - c) * 0.9, bar * 0.85), max(baseline * 0.55, tick * 0.55));
  }

  float l = PAPER * (1.0 - clamp(ink, 0.0, 1.0));
  outColor = vec4(vec3(srgb(l)), 1.0);
}`;

type Uniforms = Record<
  'uRes' | 'uTime' | 'uA' | 'uB' | 'uP' | 'uCollapse' | 'uDpr' | 'uStrip' | 'uAge',
  WebGLUniformLocation | null
>;

const INTRO_SECONDS = 2.6;

const THIRD_SOURCE_DELAY = 0.7;
const THIRD_SOURCE_RAMP = 0.9;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[interference] shader compile failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[interference] program link failed:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function mount(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-field-canvas]');
  const hero = root.closest<HTMLElement>('[data-hero]');
  if (!canvas || !hero) return;

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
  });
  if (!gl) return;

  const program = link(gl);
  if (!program) return;
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());

  const u = Object.fromEntries(
    ['uRes', 'uTime', 'uA', 'uB', 'uP', 'uCollapse', 'uDpr', 'uStrip', 'uAge'].map((name) => [
      name,
      gl.getUniformLocation(program, name),
    ]),
  ) as Uniforms;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const frameInterval = coarse || (navigator.hardwareConcurrency ?? 8) <= 6 ? 1000 / 30 : 0;

  let dpr = 1;
  let width = 1;
  let height = 1;
  let strip = 0;
  const slitA = { x: 0, y: 0 };
  const slitB = { x: 0, y: 0 };

  const src = { x: 0, y: 0, tx: 0, ty: 0, weight: 0, targetWeight: 0, lastInput: -Infinity };
  let collapse = 0;
  let collapseTarget = 0;
  let visible = true;
  let raf = 0;
  let lastFrame = 0;
  let live = false;
  const t0 = performance.now();

  function measure() {
    const rect = canvas!.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, rect.width < 768 ? 1.25 : 1.5);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas!.width !== width || canvas!.height !== height) {
      canvas!.width = width;
      canvas!.height = height;
    }
    gl!.viewport(0, 0, width, height);

    const toGl = (el: Element | null, out: { x: number; y: number }) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      out.x = (r.left + r.width / 2 - rect.left) * dpr;
      out.y = (rect.bottom - (r.top + r.height / 2)) * dpr;
    };
    toGl(hero!.querySelector('[data-slit="a"]'), slitA);
    toGl(hero!.querySelector('[data-slit="b"]'), slitB);

    const readout = hero!.querySelector<HTMLElement>('[data-readout]');
    strip = readout ? Math.max(0, (rect.bottom - readout.getBoundingClientRect().top) * dpr) : 0;

    if (!Number.isFinite(src.x) || (src.x === 0 && src.y === 0)) {
      src.x = src.tx = width * 0.3;
      src.y = src.ty = height * 0.6;
    }
    request();
  }

  function readScroll() {
    const rect = hero!.getBoundingClientRect();
    collapseTarget = clamp01(-rect.top / (rect.height * 0.62));
  }

  function draw(now: number) {
    const t = (now - t0) / 1000;
    const idle = now - src.lastInput > 2600;

    if (idle && collapse < 0.98) {
      src.tx = width * (0.46 + 0.3 * Math.sin(t * 0.11));
      src.ty = strip + (height - strip) * (0.55 + 0.28 * Math.sin(t * 0.07 + 1.3));
      src.targetWeight = 0.7;
    } else if (idle) {
      src.targetWeight = src.weight;
    }

    src.x += (src.tx - src.x) * 0.12;
    src.y += (src.ty - src.y) * 0.12;
    src.weight += (src.targetWeight - src.weight) * 0.06;
    collapse += (collapseTarget - collapse) * 0.14;
    if (Math.abs(collapseTarget - collapse) < 0.001) collapse = collapseTarget;

    gl!.uniform2f(u.uRes, width, height);
    gl!.uniform1f(u.uTime, t);
    gl!.uniform2f(u.uA, slitA.x, slitA.y);
    gl!.uniform2f(u.uB, slitB.x, slitB.y);
    const joined = clamp01((t - THIRD_SOURCE_DELAY) / THIRD_SOURCE_RAMP);
    gl!.uniform3f(u.uP, src.x, src.y, src.weight * (1 - 0.85 * collapse) * joined);
    gl!.uniform1f(u.uCollapse, collapse);
    gl!.uniform1f(u.uDpr, dpr);
    gl!.uniform1f(u.uStrip, strip);
    gl!.uniform1f(u.uAge, t);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    if (collapse >= 0.98 && !hero!.hasAttribute('data-validated')) {
      hero!.setAttribute('data-validated', '');
      document.dispatchEvent(new CustomEvent('qracon:validated'));
    }

    if (!live) {
      live = true;
      root.classList.add('is-live');
    }

    const settled =
      t > INTRO_SECONDS &&
      collapse === collapseTarget &&
      collapse >= 0.999 &&
      Math.abs(src.tx - src.x) < 0.5 &&
      Math.abs(src.ty - src.y) < 0.5 &&
      Math.abs(src.targetWeight - src.weight) < 0.002;
    return !settled;
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (frameInterval && now - lastFrame < frameInterval) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastFrame = now;
    if (draw(now)) raf = requestAnimationFrame(frame);
  }

  function request() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function onPointer(event: PointerEvent) {
    const rect = canvas!.getBoundingClientRect();
    src.tx = (event.clientX - rect.left) * dpr;
    src.ty = (rect.bottom - event.clientY) * dpr;
    src.targetWeight = 1;
    src.lastInput = performance.now();
    request();
  }

  hero.addEventListener('pointermove', onPointer, { passive: true });
  hero.addEventListener('pointerdown', onPointer, { passive: true });
  hero.addEventListener(
    'pointerleave',
    () => {
      src.targetWeight = 0;
      src.lastInput = performance.now() - 2000;
      request();
    },
    { passive: true },
  );

  window.addEventListener(
    'scroll',
    () => {
      readScroll();
      request();
    },
    { passive: true },
  );

  new ResizeObserver(measure).observe(canvas);
  document.fonts?.ready.then(measure).catch(() => {});

  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    request();
  }).observe(hero);

  document.addEventListener('visibilitychange', request);

  const stop = () => {
    visible = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    root.classList.remove('is-live');
  };

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stop();
  });

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
    if (event.matches) stop();
  });

  readScroll();
  measure();
}

