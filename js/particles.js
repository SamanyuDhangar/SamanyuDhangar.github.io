/* particles.js — dependency-free WebGL engine (INFINITE DARKNESS edition).
   Passes (one shared depth buffer, so particles pass in front of / behind the head correctly):
     1. head mesh (js/head.js geometry, custom lit shader with rim light + animated lens reflections)
     2. universe: 3 depth layers that wrap endlessly in z + proximity connection lines + pulses/flashes
     3. morph particles: the original shape-morphing system (rings / sphere / network / geometry / eclipse …)
   Fallback: if WebGL (or its shaders) fail, a FRESH canvas replaces the old one before getContext("2d") —
   a canvas that has ever returned a WebGL context can never give a 2D context. */
(function () {
  const SD = (window.SD = window.SD || {});
  const TAN = Math.tan(0.4), UD = 44;
  const COMMON = `uniform float uAsp,uTan; float zn(float d){return clamp((d-1.)/15.,0.,1.)*2.-1.;}
vec4 proj(float x,float y,float z){return vec4(x/(uTan*uAsp),y/uTan,zn(z)*z,z);}`;

  /* ---------------- morph particles (original system) ---------------- */
  const VS_M = COMMON + `
attribute vec4 aA; attribute vec4 aB; attribute vec4 aR;
uniform float uMix,uDis,uTime,uPx,uCz,uAlpha,uKeep,uLine,uLA,uRY,uRX,uScale,uRad,uFlash;
uniform vec3 uOff; uniform vec2 uMouse; varying vec4 vC;
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
  gl_Position=proj(p.x,p.y,z);
  vec3 col=mix(vec3(.50,.56,.66),vec3(.88,.92,.99),aR.y);
  if(s>.84) col=mix(col,vec3(.30,.78,1.),.85);
  if(s>.985||tag>2.5) col=vec3(.62,.55,.96);
  float sz=mix(1.1,2.6,aR.y*aR.y), a=.6;
  if(tag>.5&&tag<1.5){ col=vec3(.92,.98,1.); sz*=1.5; a=.9; }
  else if(tag>1.5&&tag<2.5){ col=vec3(1.); sz*=1.9; a=1.; }
  float depth=clamp(1.35-(z-2.6)*.3,.22,1.);
  gl_PointSize=sz*uPx*(4.2/z);
  vC=vec4(col*(1.+uFlash*.8),a*depth*uAlpha*(uLine>.5?uLA:1.));
}`;
  const FS_M = `precision mediump float; varying vec4 vC; uniform float uLine;
void main(){ float a=vC.a; if(uLine<.5){ float d=length(gl_PointCoord-.5); a*=smoothstep(.5,.12,d); } gl_FragColor=vec4(vC.rgb*a,a); }`;

  /* ---------------- universe: endless layered space ---------------- */
  const VS_U = COMMON + `
attribute vec4 aU; attribute vec4 aV; attribute float aE;
uniform float uT,uTravel,uPx,uKeep,uLine,uAlpha,uD,uFlR;
uniform vec2 uMouse,uCam; uniform vec3 uG0,uG1,uPc; uniform vec4 uPulse; uniform vec4 uFl;
varying vec4 vC;
void hide(){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vC=vec4(0.); }
vec3 disp(vec3 p,float layer,float seed){
  float amp=layer<.5?.12:(layer<1.5?.5:.8);
  p+=amp*vec3(sin(uT*.17+p.y*.21+seed*40.),sin(uT*.13+p.z*.17+seed*31.),sin(uT*.15+p.x*.19+seed*27.))*(.4+seed);
  vec3 d0=uG0-p; float l0=length(d0); p+=d0/(l0+.05)*smoothstep(6.,0.,l0)*(layer<.5?.25:.9);
  vec3 d1=uG1-p; float l1=length(d1); p+=d1/(l1+.05)*smoothstep(7.,0.,l1)*(layer<.5?.2:.7);
  return p;
}
void main(){
  float layer=floor(aU.w), seed=aU.w-layer;
  if(layer<1.5&&fract(seed*91.7)>uKeep){ hide(); return; }
  float sp=layer<.5?.12:(layer<1.5?.45:1.);
  float zw=mod(aU.z-uTravel*sp,uD);
  float dist=zw+.8;
  vec3 p=disp(vec3(aU.x,aU.y,dist),layer,seed);
  vec3 pw=p;
  float ll=0.;
  if(uLine>.5){ vec3 q=disp(vec3(aV.x,aV.y,dist+(aV.z-aU.z)),1.,aV.w); ll=length(q-pw); if(aE>.5) p=q; }
  float lf=layer<.5?.12:(layer<1.5?.45:1.1);
  p.xy-=uCam*lf*vec2(1.,.8);
  if(layer>.5&&uLine<.5){ vec2 mw=uMouse*p.z*uTan*vec2(1.7,1.); vec2 dm=p.xy-mw; float dl=length(dm); float f=smoothstep(1.2+p.z*.06,0.,dl); p.xy+=dm/(dl+.01)*f*f*.6; }
  float z=p.z;
  if(z<.9){ hide(); return; }
  gl_Position=proj(p.x,p.y,z);
  float fogv=exp(-z*(layer<.5?.012:.045));
  float fade=smoothstep(uD,uD*.82,z)*smoothstep(layer>1.5?1.6:.9,layer>1.5?5.:3.,z);
  float pulse=smoothstep(1.5,0.,abs(length(pw-uPc)-uPulse.w))*uPulse.x*uPulse.y;
  float fl=uFl.w*smoothstep(uFlR,0.,length(pw-uFl.xyz));
  vec3 col; float a,sz;
  if(layer<.5){ col=mix(vec3(.62,.72,.95),vec3(.85,.92,1.),seed); a=.28+.4*seed; sz=.9+1.1*seed; }
  else if(layer<1.5){ col=mix(vec3(.30,.72,1.),vec3(.78,.88,1.),fract(seed*7.3)); if(fract(seed*13.1)>.93) col=vec3(.62,.55,.96); a=.5; sz=2.+2.*seed; }
  else { col=mix(vec3(.80,.88,1.),vec3(.62,.55,.96),step(.8,fract(seed*5.7))); a=.30; sz=7.+9.*seed; }
  if(uLine>.5){ float la=smoothstep(2.6,.7,ll)*.16; vC=vec4(vec3(.35,.75,1.)*(1.+pulse*3.),la*fogv*fade*uAlpha*(1.+pulse*4.+fl*3.)); return; }
  gl_PointSize=clamp(layer<.5?sz*uPx:sz*uPx*(6./z),1.,layer>1.5?46.:14.);
  float tw=layer<.5?(.75+.25*sin(uT*(.8+seed*2.)+seed*50.)):1.;
  vC=vec4(col*(1.+pulse*3.+fl*4.),a*tw*(layer<.5?1.:fogv)*fade*uAlpha*(1.+pulse*2.+fl*3.));
}`;
  const FS_U = `precision mediump float; varying vec4 vC; uniform float uLine;
void main(){ float a=vC.a; if(uLine<.5){ float d=length(gl_PointCoord-.5)*2.; a*=(exp(-d*d*8.)*.85+exp(-d*3.)*.2)*smoothstep(1.,.8,d); } gl_FragColor=vec4(vC.rgb*a,a); }`;

  /* ---------------- head mesh ---------------- */
  const VS_H = COMMON + `
attribute vec3 aP; attribute vec3 aN; attribute vec2 aM;
uniform float uSc,uRY,uRX,uCz; uniform vec3 uOff;
varying vec3 vN,vW,vO; varying vec2 vM;
vec3 rot(vec3 p){ float cy=cos(uRY),sy=sin(uRY); p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z); float cx=cos(uRX),sx=sin(uRX); return vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z); }
void main(){ vec3 p=rot(aP*uSc)+uOff; vN=rot(aN); vW=p; vO=aP; vM=aM; float z=uCz-p.z; gl_Position=proj(p.x,p.y,z); }`;
  const FS_H = `precision highp float; varying vec3 vN,vW,vO; varying vec2 vM;
uniform float uT,uLit,uAlpha,uFlash,uCz;
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
vec3 env(vec3 r){
  float up=r.y*.5+.5; vec3 c=mix(vec3(.008,.012,.03),vec3(.07,.12,.24),up*up);
  c+=vec3(.78,.88,1.)*smoothstep(.42,.0,length(vec2(r.x-.5,r.y-.5)))*.95;
  c+=vec3(.2,.55,1.)*smoothstep(.25,.0,length(vec2(r.x+.75,r.y+.1)))*.7;
  float s=r.x*.85+r.y*.4+sin(uT*.32)*.95; c+=vec3(.55,.85,1.)*smoothstep(.08,.0,abs(s))*.9;
  return c;
}
void main(){
  float mat=vM.x, aux=vM.y; bool fur=mat>.5&&mat<2.5;
  if(fur&&aux<.012) discard;
  vec3 N=normalize(vN); vec3 V=normalize(vec3(0.,0.,uCz)-vW);
  if(fur){ float st=vn(vec2(vO.x*38.+sin(vO.y*9.)*2.,vO.y*5.)); float st2=vn(vec2(vO.x*90.,vO.y*18.+vO.z*30.)); N=normalize(N+vec3(st-.5,st2-.5,(st+st2)*.5-.5)*.6); }
  vec3 L1=normalize(vec3(.55,.6,.65)), L2=normalize(vec3(-.8,.25,-.55)), L3=normalize(vec3(.4,-.7,.4));
  float ndv=max(dot(N,V),0.), d1=max(dot(N,L1),0.), d2=max(dot(N,L2),0.), d3=max(dot(N,L3),0.);
  float fres=pow(1.-ndv,3.);
  vec3 key=vec3(.78,.87,1.), rim=vec3(.22,.78,1.), fill=vec3(.52,.42,.95)*.28;
  vec3 R=reflect(-V,N); vec3 H=normalize(L1+V);
  vec3 col; float a=1.;
  if(mat>3.5&&mat<4.5){ col=env(R)*(.5+fres*.9)+rim*fres*.35; col*=.35+.65*uLit; a=.95; }
  else if(mat>4.5){ col=vec3(.92,.92,.88)*(.35+.65*uLit); }
  else {
    vec3 alb; float sp,gl;
    if(mat<.5){ alb=vec3(.36,.285,.25); sp=.07; gl=18.; }
    else if(mat<1.5){ alb=vec3(.036,.036,.046); sp=.32; gl=38.; }
    else if(mat<2.5){ alb=vec3(.045,.042,.044); sp=.12; gl=24.; }
    else { alb=vec3(.016,.017,.024); sp=.9; gl=90.; }
    col=alb*(key*d1*1.15+fill*d3+vec3(.03,.045,.085))*uLit;
    col+=alb*vec3(.5,.2,.1)*.05*uLit*(1.-d1);
    col+=pow(max(dot(N,H),0.),gl)*sp*key*uLit;
    col+=env(R)*sp*(.25+fres)*(.25+.75*uLit);
    col+=rim*(fres*.85+d2*.4)*(mat<.5?.5:.8);
    col+=uFlash*vec3(.45,.7,1.)*(.25+.75*d1)*(.4+alb*2.);
  }
  col=1.-exp(-col*1.35);
  a*=uAlpha*smoothstep(-1.68,-1.15,vO.y);
  gl_FragColor=vec4(col*a,a);
}`;

  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };

  const E = (SD.engine = {
    ready: false, mode: "none", reduce: false, direct: false, headReady: false, canvas: null,
    P: 0, tgtP: 0, kf: [], mouse: { x: 0, y: 0, tx: 0, ty: 0, on: false }, scrollTravel: 0,
    S: { mix: 0, dis: 0, scale: 1, ox: 0, oy: 0, rx: 0, ry: 0, cz: 4.2, alpha: 1, la: 0, a: "rings", b: "rings", ua: 1, uk: 1, h: { ox: 0, oy: 0, oz: 0, s: 1, a: 0, lit: 0, ry: 0 } },
    keep: 1, dprMul: 1,
  });
  E.sstep = sstep; E.lerp = lerp;

  let canvas, gl, ctx2, W = 1, H = 1, dpr = 1, mobile = false, N = 0, M = 0, raf = 0, last = 0, ema = 16, frames = 0, lastAdj = 0;
  let pm, pu, ph, bufA, bufB, bufR, bufI, bufU, bufL, bufHV, bufHI, nameA = "", nameB = "", arrA, arrB, rankArr, headCount = 0, NU = 0, NL = 0, uni = null, stars2d = null;
  const loc = {}; let pid = 0;
  const L = (p, n, a) => { const k = p.__id + n; return k in loc ? loc[k] : (loc[k] = a ? gl.getAttribLocation(p, n) : gl.getUniformLocation(p, n)); };
  const pulse = { on: false, x: 0, y: 0, d: 8, t0: 0, speed: 10, max: 24, inten: 1, r: 0 }, flash = { on: false, x: 0, y: 0, d: 8, t0: 0, inten: 0, cur: 0 };
  let nextPulse = 3, nextFlash = 11;

  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  function mk(vs, fs) {
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs); if (!v || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    gl.deleteShader(v); gl.deleteShader(f); p.__id = "p" + pid++ + ":"; return p;
  }
  function swapCanvas() {
    const old = canvas, n = document.createElement("canvas");
    n.id = old.id; n.className = old.className; n.setAttribute("aria-hidden", "true");
    try { const x = gl && gl.getExtension && gl.getExtension("WEBGL_lose_context"); x && x.loseContext(); } catch (e) {}
    if (old.parentNode) old.parentNode.replaceChild(n, old);
    canvas = n; E.canvas = n; gl = null;
  }
  function setupGL() {
    pm = mk(VS_M, FS_M); pu = mk(VS_U, FS_U); ph = mk(VS_H, FS_H);
    if (!pm || !pu) return false;   /* a failing head shader only disables the head, never the whole scene */
    bufA = gl.createBuffer(); bufB = gl.createBuffer(); bufR = gl.createBuffer(); bufI = gl.createBuffer(); bufU = gl.createBuffer(); bufL = gl.createBuffer(); bufHV = gl.createBuffer(); bufHI = gl.createBuffer();
    gl.enable(gl.BLEND); gl.clearColor(0, 0, 0, 0);
    return true;
  }
  function toFallback(why) {
    console.warn("WebGL unavailable → 2D fallback:", why);
    if (gl || canvas.__usedGL) swapCanvas();         /* never ask a GL-locked canvas for "2d" */
    ctx2 = canvas.getContext("2d");
    E.mode = ctx2 ? "2d" : "none"; E.headReady = false;
    if (ctx2) { N = mobile ? 1200 : 1800; E.N = N; stars2d = Array.from({ length: mobile ? 260 : 520 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), s: Math.random() })); }
    E.resize();
  }

  function genUniverse(c0, c1, c2) {
    const R = Math.random, tot = c0 + c1 + c2, a = new Float32Array(tot * 4); let k = 0;
    const put = (x, y, z, layer) => { a[k++] = x; a[k++] = y; a[k++] = ((z % UD) + UD) % UD; a[k++] = layer + R() * 0.999; };
    const g = () => (R() + R() + R() + R() - 2) * 1.73;
    for (let i = 0; i < c0; i++) put((R() * 2 - 1) * 34, (R() * 2 - 1) * 19, R() * UD, 0);
    const cl = Array.from({ length: 14 }, () => [(R() * 2 - 1) * 12, (R() * 2 - 1) * 6.5, R() * UD, 1.6 + R() * 2]);
    const st = Array.from({ length: 5 }, () => ({ A: 3 + R() * 6, B: 2 + R() * 3, f: 0.12 + R() * 0.12, f2: 0.1 + R() * 0.12, p: R() * 6.28, p2: R() * 6.28 }));
    const rg = Array.from({ length: 4 }, () => ({ x: (R() * 2 - 1) * 5, y: (R() * 2 - 1) * 3, z: R() * UD, r: 2.2 + R() * 3.2 }));
    for (let i = 0; i < c1; i++) {
      const t = R();
      if (t < 0.4) { const c = cl[(R() * cl.length) | 0]; put(c[0] + g() * c[3], c[1] + g() * c[3] * 0.7, c[2] + g() * c[3] * 1.4, 1); }
      else if (t < 0.58) { const s = st[(R() * st.length) | 0], z = R() * UD; put(s.A * Math.sin(z * s.f + s.p) + g() * 0.25, s.B * Math.cos(z * s.f2 + s.p2) + g() * 0.25, z, 1); }
      else if (t < 0.66) { const r = rg[(R() * rg.length) | 0], an = R() * 6.2832; put(r.x + Math.cos(an) * r.r, r.y + Math.sin(an) * r.r, r.z + g() * 0.04, 1); }
      else put((R() * 2 - 1) * 15, (R() * 2 - 1) * 8.5, R() * UD, 1);
    }
    for (let i = 0; i < c2; i++) put((R() * 2 - 1) * 8, (R() * 2 - 1) * 4.8, R() * UD, 2);
    /* proximity connections between neighbouring mid-layer particles (spatial hash) */
    const cell = 1.7, hash = new Map(), pairs = [];
    for (let i = c0; i < c0 + c1; i++) { const key = Math.floor(a[i * 4] / cell) + "," + Math.floor(a[i * 4 + 1] / cell) + "," + Math.floor(a[i * 4 + 2] / cell); let l = hash.get(key); if (!l) hash.set(key, (l = [])); l.push(i); }
    hash.forEach((list) => { for (let q = 0; q + 1 < list.length && pairs.length < 1300; q += 2) { const i = list[q], j = list[q + 1]; if (Math.hypot(a[i * 4] - a[j * 4], a[i * 4 + 1] - a[j * 4 + 1], a[i * 4 + 2] - a[j * 4 + 2]) < 2.4) pairs.push(i, j); } });
    const lines = new Float32Array(pairs.length * 9);
    for (let q = 0; q < pairs.length; q += 2) for (let e = 0; e < 2; e++) { const i = pairs[q], j = pairs[q + 1]; lines.set([a[i * 4], a[i * 4 + 1], a[i * 4 + 2], a[i * 4 + 3], a[j * 4], a[j * 4 + 1], a[j * 4 + 2], a[j * 4 + 3], e], (q + e) * 9); }
    return { a, tot, lines, nl: pairs.length };
  }

  E.init = function (cv) {
    canvas = cv; E.canvas = cv;
    mobile = matchMedia("(max-width:760px)").matches || matchMedia("(pointer:coarse)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    N = mobile ? 3000 : cores >= 8 ? 8000 : 5500;
    E.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ok = false;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: true, powerPreference: "low-power", premultipliedAlpha: true }); if (gl) { canvas.__usedGL = true; ok = setupGL(); } } catch (e) { ok = false; console.warn(e); }
    if (ok) E.mode = "gl"; else toFallback("context/shader setup failed");
    if (E.mode === "none") return false;
    E.N = N;
    if (E.mode === "gl") {
      rankArr = new Float32Array(N);
      const aR = new Float32Array(N * 4), R = Math.random;
      for (let i = 0; i < N; i++) { aR[i * 4] = R(); aR[i * 4 + 1] = R(); aR[i * 4 + 2] = R(); rankArr[i] = aR[i * 4 + 3] = R(); }
      gl.bindBuffer(gl.ARRAY_BUFFER, bufR); gl.bufferData(gl.ARRAY_BUFFER, aR, gl.STATIC_DRAW);
      const lines = []; let gI = 0, s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      while (lines.length < Math.min(900, (N * 0.12) | 0) * 2 && gI++ < 40000) { const i = (rnd() * N) | 0, j = (i + 1 + ((rnd() * 10) | 0)) % N; if (rankArr[i] < 0.34 && rankArr[j] < 0.34) lines.push(i, j); }
      M = lines.length; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
      uni = genUniverse(...(mobile ? [3200, 1400, 70] : cores >= 8 ? [12000, 5000, 240] : [8500, 3600, 190]));
      NU = uni.tot; NL = uni.nl;
      gl.bindBuffer(gl.ARRAY_BUFFER, bufU); gl.bufferData(gl.ARRAY_BUFFER, uni.a, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufL); gl.bufferData(gl.ARRAY_BUFFER, uni.lines, gl.STATIC_DRAW);
      try {
        if (ph && SD.head) { const h = SD.head.build(mobile ? "low" : "high"); gl.bindBuffer(gl.ARRAY_BUFFER, bufHV); gl.bufferData(gl.ARRAY_BUFFER, h.v, gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufHI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, h.i, gl.STATIC_DRAW); headCount = h.i.length; E.headReady = true; }
      } catch (e) { console.warn("head mesh failed", e); E.headReady = false; }
    }
    E.resize(); addEventListener("resize", E.resize); document.addEventListener("visibilitychange", onVis); addEventListener("pagehide", E.destroy);
    canvas.addEventListener("webglcontextlost", onLost);
    E.ready = true; return true;
  };
  function onLost(e) { e.preventDefault(); E.stop(); toFallback("context lost"); if (SD.scroll && SD.scroll.useKeyframes) SD.scroll.useKeyframes(); E.setPair(E.S.a, E.S.b); E.start(); }

  E.setPair = function (a, b) {
    if ((a === nameA && b === nameB) || E.mode === "none") return;
    const sa = SD.getShape(a, N), sb = SD.getShape(b, N);
    arrA = sa; arrB = sb;
    if (E.mode === "gl") { gl.bindBuffer(gl.ARRAY_BUFFER, bufA); gl.bufferData(gl.ARRAY_BUFFER, sa, gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, bufB); gl.bufferData(gl.ARRAY_BUFFER, sb, gl.DYNAMIC_DRAW); }
    nameA = a; nameB = b; E.S.a = a; E.S.b = b; E.dirty = true;
  };
  E.resize = function () {
    if (!canvas) return;
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5) * E.dprMul; W = innerWidth; H = innerHeight;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr)); canvas.style.width = W + "px"; canvas.style.height = H + "px";
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    E.mobile = mobile || W < 760; E.dirty = true;
  };

  /* keyframes: {n, x,y,my, s, a, la, ry,  hx,hy,hmy,hz,hs,ha,hl} — head params prefixed h */
  E.kfState = function (P) {
    const kf = E.kf, i = Math.max(0, Math.min(kf.length - 2, Math.floor(P))), t = Math.max(0, Math.min(1, P - i)), A = kf[i], B = kf[Math.min(i + 1, kf.length - 1)];
    const halfH = 4.2 * TAN, halfW = halfH * (W / H), m = E.mobile, Lk = (k) => lerp(A[k] || 0, B[k] || 0, t), dis = Math.sin(Math.PI * t);
    return {
      a: A.n, b: B.n, mix: t, dis: dis * 1.05, scale: Lk("s") * (m ? 0.78 : 1), ox: m ? 0 : Lk("x") * halfW, oy: (m ? Lk("my") : Lk("y")) * halfH, rx: 0, ry: Lk("ry"), cz: 4.2, alpha: Lk("a") * (m ? 0.62 : 1), la: Lk("la") * (1 - dis),
      h: { ox: m ? 0 : Lk("hx") * halfW, oy: (m ? Lk("hmy") : Lk("hy")) * halfH, oz: Lk("hz"), s: Lk("hs") * (m ? 0.8 : 1), a: Lk("ha") * (m ? 0.8 : 1), lit: Lk("hl"), ry: 0 },
    };
  };
  E.pulseAt = (nx, ny, dist, speed, inten) => { if (E.reduce || E.mode !== "gl") return; Object.assign(pulse, { on: true, x: nx * dist * TAN * (W / H), y: ny * dist * TAN, d: dist, t0: E.time || 0, speed: speed || 10, max: 24, inten: inten || 1, r: 0 }); E.start(); };
  E.flashAt = (inten) => { if (E.reduce) return; Object.assign(flash, { on: true, x: (Math.random() * 2 - 1) * 5, y: (Math.random() * 2 - 1) * 2.6, d: 5 + Math.random() * 10, t0: E.time || 0, inten: inten || 0.8 }); };
  E.burst = (nx, ny) => E.pulseAt(nx, ny, 6, 16, 1.1);

  function step(t) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.1, (t - last) / 1000 || 0.016); last = t;
    const S = E.S, k = 1 - Math.exp(-dt * 5), m = E.mouse;
    m.x += (m.tx - m.x) * (1 - Math.exp(-dt * 9)); m.y += (m.ty - m.y) * (1 - Math.exp(-dt * 9));
    E.camX = (E.camX || 0) + (m.x * 0.45 - (E.camX || 0)) * (1 - Math.exp(-dt * 2.5)); E.camY = (E.camY || 0) + (m.y * 0.3 - (E.camY || 0)) * (1 - Math.exp(-dt * 2.5));
    E.time = E.reduce ? 3 : (E.time || 0) + dt;
    E.travel = E.reduce ? 0 : (E.travel || 0) + dt * 0.35;
    E.stCur = (E.stCur || 0) + ((E.reduce ? 0 : E.scrollTravel) - (E.stCur || 0)) * k;
    if (!E.direct && E.kf.length) {
      E.P += (E.tgtP - E.P) * (E.reduce ? 1 : k);
      const T = E.kfState(E.reduce ? Math.round(E.P) : E.P); E.setPair(T.a, T.b);
      const h = T.h; delete T.h; Object.assign(S, T); Object.assign(S.h, h); S.ua = 1; S.uk = 1;
    }
    /* life: rare pulses + flashes; smooth ≥0.6 s envelopes, modest intensity — never strobing */
    if (!E.reduce && E.mode === "gl" && !E.direct) {
      if (E.time > nextPulse && !pulse.on) { E.pulseAt(Math.random() * 1.4 - 0.7, Math.random() * 1.2 - 0.6, 7 + Math.random() * 12, 7 + Math.random() * 4, 0.9); nextPulse = E.time + 7 + Math.random() * 6; }
      if (E.time > nextFlash && !flash.on) { E.flashAt(0.5 + Math.random() * 0.25); nextFlash = E.time + 14 + Math.random() * 14; }
    }
    draw();
    const idle = E.reduce && !E.dirty && Math.abs(E.tgtP - E.P) < 0.001; E.dirty = false;
    if (idle) { cancelAnimationFrame(raf); raf = 0; }
    ema = ema * 0.95 + dt * 1000 * 0.05; frames++;
    if (frames > 90 && t - lastAdj > 2500 && !E.direct && ema > 27) { lastAdj = t; if (E.keep > 0.45) E.keep = Math.max(0.4, E.keep - 0.15); else if (E.dprMul > 0.7) { E.dprMul = 0.8; E.resize(); } }
  }

  function attr(p, name, buf, size, stride, off) { const l = L(p, name, true); if (l < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, off); }
  function noattr(p, name, n) { const l = L(p, name, true); if (l < 0) return; gl.disableVertexAttribArray(l); if (n === 4) gl.vertexAttrib4f(l, 0, 0, 0, 0); else gl.vertexAttrib1f(l, 0); }
  const u1 = (p, n, v) => { const l = L(p, n); if (l) gl.uniform1f(l, v); }, u2 = (p, n, a, b) => { const l = L(p, n); if (l) gl.uniform2f(l, a, b); }, u3 = (p, n, a, b, c) => { const l = L(p, n); if (l) gl.uniform3f(l, a, b, c); }, u4 = (p, n, a, b, c, d) => { const l = L(p, n); if (l) gl.uniform4f(l, a, b, c, d); };

  function draw() {
    const S = E.S, hd = S.h, tm = E.time, rot = E.reduce ? 0 : tm * 0.05, halfH = S.cz * TAN, halfW = halfH * (W / H);
    if (pulse.on) { pulse.r = (tm - pulse.t0) * pulse.speed; if (pulse.r > pulse.max) pulse.on = false; }
    if (flash.on) { const a = tm - flash.t0, e = a < 0.45 ? a / 0.45 : Math.max(0, 1 - (a - 0.45) / 1.1); flash.cur = flash.inten * e * e * (3 - 2 * e); if (a > 1.6) flash.on = false; }
    const fl = flash.on ? flash.cur : 0;
    if (E.mode === "gl") {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      const asp = W / H, px = dpr * (H / 900) * (E.mobile ? 1.15 : 1);
      /* 1 — head */
      if (E.headReady && hd.a > 0.01) {
        gl.useProgram(ph); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const yaw = (E.reduce ? 0 : Math.sin(tm * 0.21) * 0.13) + E.mouse.x * 0.32 + (hd.ry || 0), pitch = (E.reduce ? 0 : Math.sin(tm * 0.17) * 0.03) - E.mouse.y * 0.15 + 0.04;
        u1(ph, "uAsp", asp); u1(ph, "uTan", TAN); u1(ph, "uCz", S.cz); u1(ph, "uSc", hd.s * 0.9); u1(ph, "uRY", yaw); u1(ph, "uRX", pitch); u3(ph, "uOff", hd.ox, hd.oy - 0.1, hd.oz);
        u1(ph, "uT", tm); u1(ph, "uLit", hd.lit); u1(ph, "uAlpha", hd.a); u1(ph, "uFlash", fl);
        attr(ph, "aP", bufHV, 3, 32, 0); attr(ph, "aN", bufHV, 3, 32, 12); attr(ph, "aM", bufHV, 2, 32, 24);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufHI); gl.drawElements(gl.TRIANGLES, headCount, gl.UNSIGNED_SHORT, 0);
      }
      gl.depthMask(false); gl.blendFunc(gl.ONE, gl.ONE);
      /* 2 — universe */
      gl.useProgram(pu);
      const headOn = hd.a > 0.05 && E.headReady, g0x = headOn ? hd.ox : Math.sin(tm * 0.07) * 8, g0y = headOn ? hd.oy : Math.cos(tm * 0.05) * 4;
      u1(pu, "uAsp", asp); u1(pu, "uTan", TAN); u1(pu, "uT", tm); u1(pu, "uTravel", E.travel + E.stCur); u1(pu, "uPx", px); u1(pu, "uD", UD);
      u1(pu, "uKeep", Math.min(1, E.keep) * S.uk); u1(pu, "uAlpha", S.ua); u2(pu, "uMouse", E.mouse.on ? E.mouse.x : 0, E.mouse.on ? E.mouse.y : 0); u2(pu, "uCam", E.camX || 0, E.camY || 0);
      u3(pu, "uG0", g0x, g0y, headOn ? 4.2 : 12); u3(pu, "uG1", Math.sin(tm * 0.043 + 2) * 9, Math.cos(tm * 0.031) * 4.5, 14 + Math.sin(tm * 0.04) * 7);
      u3(pu, "uPc", pulse.x, pulse.y, pulse.d); u4(pu, "uPulse", pulse.on ? pulse.inten * (1 - Math.min(1, pulse.r / pulse.max)) : 0, pulse.on ? 1 : 0, 0, pulse.on ? pulse.r : 0);
      u4(pu, "uFl", flash.x, flash.y, flash.d, fl); u1(pu, "uFlR", 7);
      u1(pu, "uLine", 0); attr(pu, "aU", bufU, 4, 16, 0); noattr(pu, "aV", 4); noattr(pu, "aE", 1);
      gl.drawArrays(gl.POINTS, 0, NU);
      if (NL) { u1(pu, "uLine", 1); attr(pu, "aU", bufL, 4, 36, 0); attr(pu, "aV", bufL, 4, 36, 16); attr(pu, "aE", bufL, 1, 36, 32); gl.drawArrays(gl.LINES, 0, NL); }
      /* 3 — morph particles */
      gl.useProgram(pm);
      u1(pm, "uMix", S.mix); u1(pm, "uDis", S.dis); u1(pm, "uTime", tm); u1(pm, "uAsp", asp); u1(pm, "uTan", TAN); u1(pm, "uPx", px); u1(pm, "uCz", S.cz); u1(pm, "uAlpha", S.alpha); u1(pm, "uKeep", Math.min(1, E.keep));
      u1(pm, "uRY", S.ry + rot); u1(pm, "uRX", S.rx); u1(pm, "uScale", S.scale); u1(pm, "uRad", E.mobile || !E.mouse.on ? 0 : 0.7); u1(pm, "uFlash", fl);
      u3(pm, "uOff", S.ox, S.oy, 0); u2(pm, "uMouse", E.mouse.x * halfW, E.mouse.y * halfH); u1(pm, "uLine", 0); u1(pm, "uLA", 1);
      attr(pm, "aA", bufA, 4, 0, 0); attr(pm, "aB", bufB, 4, 0, 0); attr(pm, "aR", bufR, 4, 0, 0);
      gl.drawArrays(gl.POINTS, 0, N);
      if (S.la > 0.004 && M) { u1(pm, "uLine", 1); u1(pm, "uLA", S.la); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufI); gl.drawElements(gl.LINES, M, gl.UNSIGNED_SHORT, 0); }
    } else if (E.mode === "2d") draw2d(rot);
  }

  function draw2d(rot) {
    const S = E.S; ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, canvas.width, canvas.height);
    if (stars2d) for (const s of stars2d) { const z = (((s.z - (E.travel || 0) * 0.03 * (0.3 + s.s)) % 1) + 1) % 1, d = 0.12 + z, x = (0.5 + (s.x / d) * 0.08) * canvas.width, y = (0.5 + (s.y / d) * 0.08) * canvas.height; if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) continue; ctx2.fillStyle = `rgba(${s.s > 0.85 ? "110,215,255" : "190,205,235"},${0.15 + (1 - z) * 0.55})`; const sz = (0.6 + s.s * 1.4) * dpr * (1.3 - z); ctx2.fillRect(x, y, sz, sz); }
    if (!arrA) return;
    const m = Math.min(1, S.mix), cy = Math.cos(S.ry + rot), sy = Math.sin(S.ry + rot);
    for (let i = 0; i < N; i++) {
      const o = i * 4, x = arrA[o] + (arrB[o] - arrA[o]) * m, y = arrA[o + 1] + (arrB[o + 1] - arrA[o + 1]) * m, z = arrA[o + 2] + (arrB[o + 2] - arrA[o + 2]) * m, sd = (i * 0.61803) % 1;
      const px = (x + Math.sin(sd * 40) * S.dis) * S.scale, py = (y + Math.cos(sd * 30) * S.dis) * S.scale, pz = z * S.scale;
      const rx = cy * px + sy * pz + S.ox, rz = -sy * px + cy * pz, d = S.cz - rz;
      const sx = ((rx / (d * TAN * (W / H))) * 0.5 + 0.5) * canvas.width, sy2 = (0.5 - ((py + S.oy) / (d * TAN)) * 0.5) * canvas.height;
      const tag = m < 0.5 ? arrA[o + 3] : arrB[o + 3], a = Math.max(0.15, 1.3 - (d - 2.6) * 0.3) * S.alpha * 0.8, sz = (tag ? 2.6 : 1.4) * dpr;
      ctx2.fillStyle = tag === 2 ? "rgba(255,255,255," + a + ")" : tag === 1 ? "rgba(225,245,255," + a + ")" : tag === 3 || sd > 0.97 ? "rgba(160,140,245," + a * 0.8 + ")" : sd > 0.84 ? "rgba(92,214,242," + a * 0.7 + ")" : "rgba(170,184,204," + a * 0.6 + ")";
      ctx2.fillRect(sx, sy2, sz, sz);
    }
  }

  E.start = function () { if (!raf && E.ready && E.mode !== "none" && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(step); } };
  E.stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };
  E.request = function () { E.dirty = true; E.start(); };
  function onVis() { if (document.hidden) E.stop(); else E.start(); }
  E.destroy = function () {
    E.stop(); removeEventListener("resize", E.resize); document.removeEventListener("visibilitychange", onVis); removeEventListener("pagehide", E.destroy);
    if (canvas) canvas.removeEventListener("webglcontextlost", onLost);
    if (gl) { [bufA, bufB, bufR, bufI, bufU, bufL, bufHV, bufHI].forEach((b) => b && gl.deleteBuffer(b)); [pm, pu, ph].forEach((p) => p && gl.deleteProgram(p)); const x = gl.getExtension("WEBGL_lose_context"); x && x.loseContext(); }
    E.ready = false;
  };
})();
