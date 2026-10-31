/* particles.js — dependency-free WebGL point engine.
   Every particle lives in two buffers (shape A, shape B); the GPU morphs between them, scatters
   ("dissolves") mid-way, adds idle drift + cursor displacement, and projects with a real perspective camera. */
(function () {
  const SD = (window.SD = window.SD || {});
  const VS = `
attribute vec4 aA; attribute vec4 aB; attribute vec4 aR;
uniform float uMix,uDis,uTime,uAsp,uPx,uCz,uAlpha,uKeep,uLine,uLA,uTan,uRY,uRX,uScale,uRad;
uniform vec3 uOff; uniform vec2 uMouse;
varying vec4 vC;
void hide(){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vC=vec4(0.); }
void main(){
  if(aR.w>uKeep){ hide(); return; }
  float s=aR.x;
  float m=clamp(uMix*1.5-s*.5,0.,1.); m=m*m*(3.-2.*m);
  vec3 p=mix(aA.xyz,aB.xyz,m);
  float tag=m<.5?aA.w:aB.w;
  float t=uTime*.3+aR.z*6.2832;
  p+=.02*vec3(sin(t*1.3+p.y*3.),cos(t*1.1+p.z*3.),sin(t*.9+p.x*3.));
  vec3 dir=normalize(vec3(sin(s*91.7+1.),cos(s*57.3),sin(s*33.1)+.4));
  p+=dir*uDis*(.5+1.2*fract(s*13.7))+vec3(sin(t+aR.y*5.),cos(t*.8),0.)*uDis*.15;
  p*=uScale;
  float cy=cos(uRY),sy=sin(uRY); p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
  float cx=cos(uRX),sx=sin(uRX); p=vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z);
  p+=uOff;
  vec2 dm=p.xy-uMouse; float dl=length(dm); float f=smoothstep(uRad,0.,dl);
  p.xy+=dm/(dl+.001)*f*f*.32; p.z+=f*.25;
  float z=uCz-p.z;
  if(z<.3){ hide(); return; }
  gl_Position=vec4(p.x/(z*uTan*uAsp),p.y/(z*uTan),0.,1.);
  vec3 col=mix(vec3(.50,.56,.64),vec3(.88,.92,.97),aR.y);
  if(s>.84) col=mix(col,vec3(.36,.84,.95),.85);
  if(s>.985||tag>2.5) col=vec3(.92,.66,.32);
  float sz=mix(1.1,2.6,aR.y*aR.y), a=.6;
  if(tag>.5&&tag<1.5){ col=vec3(.92,.98,1.); sz*=1.5; a=.9; }
  else if(tag>1.5&&tag<2.5){ col=vec3(1.); sz*=1.9; a=1.; }
  float depth=clamp(1.35-(z-2.6)*.3,.22,1.);
  gl_PointSize=sz*uPx*(4.2/z);
  vC=vec4(col,a*depth*uAlpha*(uLine>.5?uLA:1.));
}`;
  const FS = `precision mediump float; varying vec4 vC; uniform float uLine;
void main(){ float a=vC.a; if(uLine<.5){ float d=length(gl_PointCoord-.5); a*=smoothstep(.5,.12,d); } gl_FragColor=vec4(vC.rgb*a,a); }`;

  const TAN = Math.tan(0.4);          // half-FOV
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };

  const E = (SD.engine = {
    ready: false, mode: "none", reduce: false, direct: false,
    P: 0, tgtP: 0, kf: [], mouse: { x: 0, y: 0, tx: 0, ty: 0, on: false },
    S: { mix: 0, dis: 0, scale: 1, ox: 0, oy: 0, rx: 0, ry: 0, cz: 4.2, alpha: 1, la: 0, a: "sphere", b: "sphere" },
    keep: 1, dprMul: 1,
  });
  E.sstep = sstep; E.lerp = lerp;

  let canvas, gl, ctx2, prog, U = {}, bufA, bufB, bufR, bufI, N = 0, M = 0, nameA = "", nameB = "", raf = 0, last = 0, ema = 16, frames = 0, lastAdj = 0, W = 1, H = 1, dpr = 1, mobile = false;
  let arrA, arrB, rankArr;

  E.init = function (cv) {
    canvas = cv;
    mobile = matchMedia("(max-width:760px)").matches || matchMedia("(pointer:coarse)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    N = mobile ? 3600 : cores >= 8 ? 9000 : 6500;
    E.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gl = null;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power", premultipliedAlpha: true }); } catch (e) {}
    if (gl && setupGL()) E.mode = "gl";
    else { E.mode = "2d"; N = mobile ? 1200 : 1800; ctx2 = canvas.getContext("2d"); }
    E.N = N;
    const R = Math.random;
    rankArr = new Float32Array(N);
    const aR = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) { aR[i * 4] = R(); aR[i * 4 + 1] = R(); aR[i * 4 + 2] = R(); rankArr[i] = aR[i * 4 + 3] = R(); }
    if (E.mode === "gl") {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufR); gl.bufferData(gl.ARRAY_BUFFER, aR, gl.STATIC_DRAW);
      buildLines();
    }
    E.resize(); addEventListener("resize", E.resize);
    document.addEventListener("visibilitychange", onVis);
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); E.stop(); E.mode = "lost"; });
    addEventListener("pagehide", E.destroy);
    E.ready = true;
    return true;
  };

  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  function setupGL() {
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS); if (!v || !f) return false;
    prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.deleteShader(v); gl.deleteShader(f); gl.useProgram(prog);
    ["uMix", "uDis", "uTime", "uAsp", "uPx", "uCz", "uAlpha", "uKeep", "uLine", "uLA", "uTan", "uRY", "uRX", "uScale", "uRad", "uOff", "uMouse"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    bufA = gl.createBuffer(); bufB = gl.createBuffer(); bufR = gl.createBuffer(); bufI = gl.createBuffer();
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    return true;
  }
  function bindAttr(name, buf) { const l = gl.getAttribLocation(prog, name); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 0, 0); }
  function buildLines() {
    const pairs = [], target = Math.min(1100, Math.floor(N * 0.12)); let g = 0, s = 5;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    while (pairs.length < target * 2 && g++ < target * 30) { const i = (rnd() * N) | 0, j = (i + 1 + ((rnd() * 10) | 0)) % N; if (rankArr[i] < 0.34 && rankArr[j] < 0.34) pairs.push(i, j); }
    M = pairs.length; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pairs), gl.STATIC_DRAW);
  }

  E.setPair = function (a, b) {
    if (a === nameA && b === nameB) return;
    if (E.mode === "lost") return;
    const sa = SD.getShape(a, N), sb = SD.getShape(b, N);
    if (a !== nameA || b !== nameB) { arrA = sa; arrB = sb; }
    if (E.mode === "gl") {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufA); gl.bufferData(gl.ARRAY_BUFFER, sa, gl.DYNAMIC_DRAW); bindAttr("aA", bufA);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufB); gl.bufferData(gl.ARRAY_BUFFER, sb, gl.DYNAMIC_DRAW); bindAttr("aB", bufB);
      bindAttr("aR", bufR);
    }
    nameA = a; nameB = b; E.S.a = a; E.S.b = b; E.dirty = true;
  };

  E.resize = function () {
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5) * E.dprMul;
    W = innerWidth; H = innerHeight;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    E.mobile = mobile || W < 760; E.dirty = true;
  };

  /* scroll keyframes: [{n:shape, x,y (fraction of half-viewport), s, a, la, ry}] and P = float section progress */
  E.kfState = function (P) {
    const kf = E.kf, i = Math.max(0, Math.min(kf.length - 2, Math.floor(P))), t = Math.max(0, Math.min(1, P - i)), A = kf[i], B = kf[Math.min(i + 1, kf.length - 1)];
    const halfH = E.S.cz * TAN, halfW = halfH * (W / H), m = E.mobile;
    const L = (k) => lerp(A[k], B[k], t);
    const dis = Math.sin(Math.PI * t);
    return { a: A.n, b: B.n, mix: t, dis: dis * 1.05, scale: L("s") * (m ? 0.78 : 1), ox: m ? 0 : L("x") * halfW, oy: (m ? L("my") : L("y")) * halfH, rx: 0, ry: L("ry"), cz: 4.2, alpha: L("a") * (m ? 0.62 : 1), la: L("la") * (1 - dis) };
  };

  function step(t) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.1, (t - last) / 1000 || 0.016); last = t;
    const S = E.S, k = 1 - Math.exp(-dt * 5);
    E.mouse.x += (E.mouse.tx - E.mouse.x) * (1 - Math.exp(-dt * 9)); E.mouse.y += (E.mouse.ty - E.mouse.y) * (1 - Math.exp(-dt * 9));
    if (!E.direct && E.kf.length) {
      E.P += (E.tgtP - E.P) * (E.reduce ? 1 : k);
      const T = E.kfState(E.reduce ? Math.round(E.P) : E.P); E.setPair(T.a, T.b); Object.assign(S, T, { a: T.a, b: T.b });
    }
    E.time = E.reduce ? 3 : (E.time || 0) + dt;
    draw(dt);
    if (E.reduce && !E.dirty && Math.abs(E.tgtP - E.P) < 0.001) { cancelAnimationFrame(raf); raf = 0; }
    E.dirty = false;
    /* adaptive quality */
    ema = ema * 0.95 + dt * 1000 * 0.05; frames++;
    if (frames > 90 && t - lastAdj > 2500 && !E.direct) {
      if (ema > 27) { lastAdj = t; if (E.keep > 0.45) E.keep = Math.max(0.4, E.keep - 0.15); else if (E.dprMul > 0.7) { E.dprMul = 0.8; E.resize(); } }
    }
  }

  function draw(dt) {
    const S = E.S, rot = E.reduce ? 0 : E.time * 0.05;
    if (E.mode === "gl") {
      gl.clear(gl.COLOR_BUFFER_BIT);
      const halfH = S.cz * TAN, halfW = halfH * (W / H);
      gl.uniform1f(U.uMix, S.mix); gl.uniform1f(U.uDis, S.dis); gl.uniform1f(U.uTime, E.time); gl.uniform1f(U.uAsp, W / H);
      gl.uniform1f(U.uPx, dpr * (H / 900) * (E.mobile ? 1.15 : 1)); gl.uniform1f(U.uCz, S.cz); gl.uniform1f(U.uAlpha, S.alpha); gl.uniform1f(U.uKeep, E.keep);
      gl.uniform1f(U.uTan, TAN); gl.uniform1f(U.uRY, S.ry + rot); gl.uniform1f(U.uRX, S.rx); gl.uniform1f(U.uScale, S.scale); gl.uniform1f(U.uRad, E.mobile || !E.mouse.on ? 0 : 0.7);
      gl.uniform3f(U.uOff, S.ox, S.oy, 0); gl.uniform2f(U.uMouse, E.mouse.x * halfW, E.mouse.y * halfH);
      gl.uniform1f(U.uLine, 0); gl.uniform1f(U.uLA, 1);
      gl.drawArrays(gl.POINTS, 0, N);
      if (S.la > 0.004 && M) { gl.uniform1f(U.uLine, 1); gl.uniform1f(U.uLA, S.la * (E.keep >= 0.4 ? 1 : 0)); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufI); gl.drawElements(gl.LINES, M, gl.UNSIGNED_SHORT, 0); }
    } else if (E.mode === "2d" && arrA) {
      ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, canvas.width, canvas.height);
      const m = Math.min(1, S.mix), cy = Math.cos(S.ry + rot), sy = Math.sin(S.ry + rot), halfH = S.cz * TAN, halfW = halfH * (W / H);
      for (let i = 0; i < N; i++) {
        const o = i * 4, x = arrA[o] + (arrB[o] - arrA[o]) * m, y = arrA[o + 1] + (arrB[o + 1] - arrA[o + 1]) * m, z = arrA[o + 2] + (arrB[o + 2] - arrA[o + 2]) * m, sd = (i * 0.61803) % 1;
        const px = (x + Math.sin(sd * 40) * S.dis) * S.scale, py = (y + Math.cos(sd * 30) * S.dis) * S.scale, pz = z * S.scale;
        const rx = cy * px + sy * pz + S.ox, rz = -sy * px + cy * pz, d = S.cz - rz;
        const sx = (rx / (d * TAN * (W / H)) * 0.5 + 0.5) * canvas.width, sy2 = (0.5 - (py + S.oy) / (d * TAN) * 0.5) * canvas.height;
        const tag = m < 0.5 ? arrA[o + 3] : arrB[o + 3], a = Math.max(0.15, 1.3 - (d - 2.6) * 0.3) * S.alpha * 0.8, sz = (tag ? 2.6 : 1.4) * dpr;
        ctx2.fillStyle = tag === 2 ? "rgba(255,255,255," + a + ")" : tag === 1 ? "rgba(225,245,255," + a + ")" : tag === 3 || sd > 0.97 ? "rgba(235,168,82," + a * 0.8 + ")" : sd > 0.84 ? "rgba(92,214,242," + a * 0.7 + ")" : "rgba(170,184,204," + a * 0.6 + ")";
        ctx2.fillRect(sx, sy2, sz, sz);
      }
    }
  }

  E.start = function () { if (!raf && E.ready && E.mode !== "lost" && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(step); } };
  E.stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };
  E.request = function () { E.dirty = true; E.start(); };
  function onVis() { if (document.hidden) E.stop(); else E.start(); }
  E.destroy = function () {
    E.stop(); removeEventListener("resize", E.resize); document.removeEventListener("visibilitychange", onVis);
    if (gl) { [bufA, bufB, bufR, bufI].forEach((b) => b && gl.deleteBuffer(b)); prog && gl.deleteProgram(prog); const x = gl.getExtension("WEBGL_lose_context"); x && x.loseContext(); }
    E.ready = false;
  };
})();
