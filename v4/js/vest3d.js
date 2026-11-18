/* 쇼핑몰 홈 v3 시제품용 (2026-11-10): noeul.ai.kr home-vest3d.js(= 쇼핑몰 includes/vest3d.js v=20261028b)를 복사해 고친 것.
   바꾼 곳: (1) 자동 시연을 끄고 스크롤 연출이 조끼를 움직이게 함 (2) 바깥에서 쓰는 window.B2BTVest (3) 회사명 글자 로고 setText (4) 스크롤 방향 맞춤.
   모델·원단·색 입히기·데칼 계산은 원본 그대로 */
/* 회사소개 사이트(noeul.ai.kr) 메인용 복사본 — 2026-11-04 쇼핑몰 메인 '비투비티는 전부 제작 가능합니다!' 구역을 옮기며 쇼핑몰 includes/vest3d.js(v=20261028b)를 그대로 복사.
   바꾼 곳은 로고 그림 주소(LOGO_SRC) 한 줄뿐. 모델·원단 사진 주소는 원래대로 .c3-stage data-* 에서 읽는다. */
/* 메인 맞춤작업복(#customSection) 3D 조끼 맞춤 시연 — 2026-10-15
   - 사용자 요청: '3D로 뭘 한다'보다 '맞춤작업복을 맡기면 이렇게 원하는 대로 다 만들 수 있구나'를 보여 주는 시연.
     재질(옥스포드·메쉬·타스란·트윌·폴리에스터) · 색상 · 로고 위치(왼가슴·오른가슴·등 목밑·등 중앙·등 하단)를 고르면 조끼가 바로 바뀐다.
   - 모델: img/3d/oxford-vest.glb, img/3d/taslan-vest.glb(원본 '타스란 3d.glb' 32MB → gltf-transform으로 2.0MB). 두 모델은 모양(메쉬)이 같고 질감만 다르다.
     메쉬 재질은 별도 모델이 없어 옥스포드 모델에 작은 구멍 무늬를 뚫어(셰이더 discard) 보여 준다. 구멍은 몸통을 한 바퀴 도는 좌표로 깔아 옆구리·구김까지 이어진다.
   - 트윌·폴리에스터(2026-10-16 사용자 요청)도 옥스포드 모델에 원단 값(결 무늬·거칠기·광택)만 바꿔 끼운다.
     트윌 = 사선 이랑이 보이는 2/1 능직, 무광에 비스듬히 볼 때만 은은한 잔털 광(sheen). 폴리에스터 = 촘촘한 평직, 매끈하고 은은한 광택.
     (참고: 일반 PBR 재질표에서 면·캔버스 거칠기 0.8~0.9, 폴리에스터·나일론 0.6~0.8 — 폴리에스터가 더 매끈. 천 느낌은 거칠기보다 sheen 층이 좌우)
   - 색상: 원래 검정 원단 텍스처의 밝기를 결로 남기고 고른 색을 입힌다. 반사띠·지퍼처럼 밝은 부분은 원래 색 그대로.
   - 로고: 회사 로고를 데칼(DecalGeometry)로 옷 표면에 붙인다(2026-10-15 사용자 요청: 'LOGO' 표시 → 회사 로고). 앞/뒤 위치를 고르면 카메라가 그쪽으로 돈다.
     2026-10-27 상호 변경(노을상사 → 비투비티) 때 글자만 → 2026-10-28 옛 N 심볼 + 글자 → 2026-10-28 새 로고(파랑·보라 그러데이션 'B' 심볼 + 남색 기울임 '비투비티')로 바꿨다.
     원단마다 심볼이 보이게 세 가지 중 하나(LOGO_LOOK): color = 원래 색(img/b2bt-v2-vest.png), reverse = 색 B + 흰 글자(img/b2bt-v2-vest-reverse.png),
     white = 전체 흰색(같은 모양을 흰색으로 채움). 파랑·보라가 묻히거나 부딪히는 원단(네이비·로얄블루·레드 등)은 흰색.
   - 손대지 않으면 조합을 차례로 바꿔 가며 자동 시연(움직임 줄이기 설정이면 하지 않음). 옵션을 누르거나 드래그하면 멈춘다.
   - 2026-10-15 리디자인: 3D는 '이렇게 다양하게 맞춤작업복된다'를 보여 주는 참고용 예시(고른 대로 주문하는 기능 아님).
     조끼 위 로고 자리 점(핫스팟, 화면 좌표는 매 프레임 계산), 앞면/뒷면 버튼.
   - three.js 등은 섹션이 화면 가까이 오면 CDN(jsDelivr +esm, 같은 three 인스턴스)에서 불러온다. WebGL이 안 되면 안내 문구만. */
// 메인 맞춤작업복(#customSection)과 맞춤작업복 소개(custom-intro.php의 data-vest3d 구역)에서 같이 쓴다(2026-10-15)
const root = document.querySelector('[data-vest3d]') || document.getElementById('customSection');
const stageBox = root && root.querySelector('.c3-stage');
const stage = root && root.querySelector('.c3-stage__canvas');
const stateEl = root && root.querySelector('.c3-stage__state');
const demoBtn = root && root.querySelector('.c3-demo');
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';

// 로고 위치: 모델 크기에 대한 비율(x: 좌우 반폭, y: 위아래 반높이, w: 로고 가로 = 좌우 반폭 대비). 착용자 기준 왼가슴 = 화면에서 오른쪽(+x)
// 2026-10-28 새 로고(가로:세로 약 4.53:1, 전 N 심볼 로고는 약 2.64:1)로 바꾸며 세로 높이가 전과 비슷하게 w를 넓혔다.
// 가슴·목밑은 너무 넓어지지 않게 높이를 조금 줄였다(전 높이 대비 가슴 약 86%, 목밑 약 89%, 등 중앙 약 98%, 등 하단 약 94%)
const LOGO_SPOTS = {
  lchest: { side: 'front', x: 0.40, y: 0.36, w: 0.40 },
  rchest: { side: 'front', x: -0.40, y: 0.36, w: 0.40 },
  nape: { side: 'back', x: 0, y: 0.47, w: 0.46 },
  center: { side: 'back', x: 0, y: 0.12, w: 0.78 },
  lower: { side: 'back', x: 0, y: -0.50, w: 0.58 },
};
// 자동 시연 순서
const DEMO = [
  { material: 'oxford', color: 'black', logos: ['lchest'] },
  { material: 'oxford', color: 'navy', logos: ['lchest'] },
  { material: 'taslan', color: 'neon-yellow', logos: ['lchest', 'rchest'] },
  { material: 'taslan', color: 'neon-yellow', logos: ['center'] },
  { material: 'mesh', color: 'neon-orange', logos: ['nape', 'lower'] },
  { material: 'mesh', color: 'gray', logos: ['lchest'] },
  { material: 'twill', color: 'khaki', logos: ['lchest'] },
  { material: 'polyester', color: 'royal', logos: ['rchest'] },
  { material: 'oxford', color: 'red', logos: ['rchest'] },
  { material: 'taslan', color: 'khaki', logos: ['nape', 'center'] },
];
const DEMO_MS = 3200;

const state = { material: 'oxford', color: 'black', logos: new Set(['lchest']) };
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function setState(msg) {
  if (!stateEl) return;
  stateEl.textContent = msg || '';
  stateEl.hidden = !msg;
}
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}
function optButtons(attr) { return Array.prototype.slice.call(root.querySelectorAll('[' + attr + ']')); }
function colorHex(key) {
  const b = root.querySelector('[data-color="' + key + '"]');
  return b ? b.getAttribute('data-hex') : '#1b1c1f';
}

// 패널 표시를 state에 맞춘다(자동 시연 중에도 함께 바뀌어 '고르는 장면'처럼 보이게)
function syncUI() {
  optButtons('data-material').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.material === state.material)));
  optButtons('data-color').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.color === state.color)));
  optButtons('data-logo').forEach((b) => b.setAttribute('aria-pressed', String(state.logos.has(b.dataset.logo))));
  optButtons('data-hot').forEach((b) => b.setAttribute('aria-pressed', String(state.logos.has(b.dataset.hot))));
  const val = (k, text) => { root.querySelectorAll('[data-val="' + k + '"]').forEach((el) => { el.textContent = text; }); };
  const pick = (attr, key) => { const b = root.querySelector('[' + attr + '="' + key + '"]'); return b ? (b.getAttribute('data-name') || b.textContent.trim()) : ''; };
  val('material', pick('data-material', state.material));
  val('color', pick('data-color', state.color));
  val('logo', state.logos.size ? Array.from(state.logos).map((k) => pick('data-logo', k)).join(' · ') : '로고 없음');
}

let api = null; // 3D가 준비되면 { apply(view) }
let demoTimer = 0;
let demoIndex = 0;
let demoOn = false;

function setDemoButton() {
  if (!demoBtn) return;
  demoBtn.setAttribute('aria-pressed', String(demoOn));
  const label = demoBtn.querySelector('.c3-demo__label');
  if (label) label.textContent = demoOn ? '시연 멈춤' : '자동 시연';
}
function stopDemo() {
  demoOn = false;
  clearTimeout(demoTimer);
  setDemoButton();
}
function demoStep() {
  const step = DEMO[demoIndex % DEMO.length];
  demoIndex += 1;
  state.material = step.material;
  state.color = step.color;
  state.logos = new Set(step.logos);
  syncUI();
  if (api) api.apply(true);
  demoTimer = setTimeout(function tick() {
    if (!demoOn) return;
    if (api && !api.isVisible()) { demoTimer = setTimeout(tick, 600); return; }
    demoStep();
  }, DEMO_MS);
}
function startDemo() {
  if (reduceMotion) return;
  demoOn = true;
  setDemoButton();
  clearTimeout(demoTimer);
  demoStep();
}

function bindPanel() {
  optButtons('data-material').forEach((b) => b.addEventListener('click', () => { stopDemo(); state.material = b.dataset.material; syncUI(); if (api) api.apply(false); }));
  optButtons('data-color').forEach((b) => b.addEventListener('click', () => { stopDemo(); state.color = b.dataset.color; syncUI(); if (api) api.apply(false); }));
  const toggleLogo = (k) => {
    stopDemo();
    if (state.logos.has(k)) state.logos.delete(k); else state.logos.add(k);
    syncUI();
    if (api) api.apply(state.logos.has(k) ? LOGO_SPOTS[k].side : null);
  };
  optButtons('data-logo').forEach((b) => b.addEventListener('click', () => toggleLogo(b.dataset.logo)));
  // 조끼 위 점(핫스팟)을 눌러도 같은 로고 위치가 켜지고 꺼진다
  optButtons('data-hot').forEach((b) => b.addEventListener('click', () => toggleLogo(b.dataset.hot)));
  // 앞면/뒷면 보기
  optButtons('data-view').forEach((b) => b.addEventListener('click', () => { stopDemo(); if (api) api.turnTo(b.dataset.view); }));
  // 라디오 그룹 화살표 키 이동
  root.querySelectorAll('[role="radiogroup"]').forEach((g) => {
    g.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key) < 0) return;
      const items = Array.prototype.slice.call(g.querySelectorAll('[role="radio"]'));
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const n = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
      n.focus(); n.click();
    });
  });
  if (demoBtn) demoBtn.addEventListener('click', () => { if (demoOn) stopDemo(); else startDemo(); });
  syncUI();
  setDemoButton();
}

// 비투비티 새 로고(2026-10-28): 투명 여백을 뺀 영역 [x0, y0, x1, y1](두 파일 공통 1849×427 중, 알파>0 경계 = 1825×403, 가로:세로 약 4.53:1).
// 두 파일은 모양(알파)이 똑같고 색만 다르다. 전체 흰색은 이 모양을 흰색으로 채워 만든다
// 회사소개 사이트 복사본(2026-11-04): 로고 그림 주소는 .c3-stage의 data-logo-color·data-logo-reverse(테마 assets/img/home/)에서 읽는다
const LOGO_SRC = { color: (stageBox && stageBox.dataset.logoColor) || 'img/b2bt-v2-vest.png', reverse: (stageBox && stageBox.dataset.logoReverse) || 'img/b2bt-v2-vest-reverse.png' };
const LOGO_CROP = [12, 12, 1837, 415];
// 원단별 로고(2026-10-28 원단 11색 × 3종을 3D 화면에서 비교해 정함). 목록에 없는 색은 밝으면 color, 어두우면 white
// - 블랙·차콜·카키: 색 B가 보여 reverse. 네이비: B 아래쪽 남색이 원단에 묻혀 white. 로얄블루: 파란 B가 묻혀 white. 레드: 파랑·보라와 부딪혀 white
const LOGO_LOOK = {
  white: 'color', gray: 'color', 'neon-yellow': 'color', 'neon-green': 'color', 'neon-orange': 'color',
  black: 'reverse', charcoal: 'reverse', khaki: 'reverse',
  navy: 'white', royal: 'white', red: 'white',
};
function loadImage(src) {
  return new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = src; });
}
async function makeLogoTextures(THREE) {
  const [x0, y0, x1, y1] = LOGO_CROP;
  const w = x1 - x0, h = y1 - y0;
  const [color, reverse] = await Promise.all([loadImage(LOGO_SRC.color), loadImage(LOGO_SRC.reverse)]);
  function tex(img, mono) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    if (mono) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }   // 모양 그대로 전체 흰색
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  return { color: tex(color, false), reverse: tex(reverse, false), white: tex(reverse, true), aspect: w / h };
}
// 로고 파일을 못 불러오면 쓰는 대신 표시('LOGO')
function makeFallbackLogo(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 200;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineWidth = 14;
  g.beginPath(); g.arc(96, 100, 62, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(66, 128); g.lineTo(96, 66); g.lineTo(126, 128); g.closePath(); g.fill();
  g.font = '800 116px Pretendard, "Apple SD Gothic Neo", Arial, sans-serif';
  g.textBaseline = 'middle';
  g.fillText('LOGO', 182, 106);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { color: t, reverse: t, white: t, aspect: c.width / c.height, tint: true };
}

async function start() {
  if (!hasWebGL()) { setState('이 브라우저에서는 3D 미리보기를 표시할 수 없습니다.'); return; }
  setState('3D 모델을 불러오는 중입니다…');
  let THREE, GLTFLoader, OrbitControls, MeshoptDecoder, DecalGeometry, RoomEnvironment;
  try {
    [THREE, { GLTFLoader }, { OrbitControls }, { MeshoptDecoder }, { DecalGeometry }, { RoomEnvironment }] = await Promise.all([
      import(CDN + '/+esm'),
      import(CDN + '/examples/jsm/loaders/GLTFLoader.js/+esm'),
      import(CDN + '/examples/jsm/controls/OrbitControls.js/+esm'),
      import(CDN + '/examples/jsm/libs/meshopt_decoder.module.js/+esm'),
      import(CDN + '/examples/jsm/geometries/DecalGeometry.js/+esm'),
      import(CDN + '/examples/jsm/environments/RoomEnvironment.js/+esm'),
    ]);
  } catch (e) { setState('3D 미리보기를 불러오지 못했습니다.'); return; }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  // 실내 조명 환경맵: 원단의 광택·결 차이가 자연스럽게 보이게(2026-10-15 '실제 원단 느낌과 다르다' 요청)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bec7, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(2.5, 3, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-3, 1.5, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(0, 2.5, -4); scene.add(rim);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.8;
  controls.addEventListener('start', () => { stopDemo(); turn = null; scrollAz = null; if (stageBox) stageBox.classList.add('is-drag'); });
  controls.addEventListener('end', () => { if (stageBox) stageBox.classList.remove('is-drag'); });

  // 원단 결: 옥스포드 = 바스켓 직조 격자(코드로 그림), 타스란 = 실제 타스란 원단 사진(img/3d/taslan-detail.jpg)을 몸판 좌표에 바둑판처럼 반복해 입힌다.
  // 결의 밝기로 색을 살짝 흔들고(uDAmt) 같은 값으로 표면을 오돌토돌하게(uBump) 만든다. 실제 결보다 크게 그려야 화면에서 보인다
  function weaveTexture() {
    const n = 128, c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, n, n);
    const cell = 16; // 실 두 가닥씩 가로·세로가 번갈아 엮인 옥스포드 짜임
    for (let y = 0; y < n; y += cell) {
      for (let x = 0; x < n; x += cell) {
        const horiz = ((x + y) / cell) % 2 === 0;
        for (let k = 0; k < 2; k++) {
          const gr = horiz ? g.createLinearGradient(0, y + k * 8, 0, y + k * 8 + 8) : g.createLinearGradient(x + k * 8, 0, x + k * 8 + 8, 0);
          gr.addColorStop(0, '#5a5a5a'); gr.addColorStop(0.5, '#b4b4b4'); gr.addColorStop(1, '#5a5a5a');
          g.fillStyle = gr;
          if (horiz) g.fillRect(x, y + k * 8 + 1, cell, 6); else g.fillRect(x + k * 8 + 1, y, 6, cell);
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }
  // 칸마다 경사(세로 실)가 위로 올라오는지(isWarp)에 따라 세로/가로 실을 그려 짜임을 만든다. n은 짜임 한 바퀴의 배수여야 이음매 없이 반복된다
  function wovenTexture(n, cell, isWarp, lo, hi) {
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    g.fillStyle = lo; g.fillRect(0, 0, n, n);
    for (let j = 0; j < n / cell; j++) {
      for (let i = 0; i < n / cell; i++) {
        const x = i * cell, y = j * cell, warp = isWarp(i, j);
        const gr = warp ? g.createLinearGradient(x, 0, x + cell, 0) : g.createLinearGradient(0, y, 0, y + cell);
        gr.addColorStop(0, lo); gr.addColorStop(0.5, hi); gr.addColorStop(1, lo);
        g.fillStyle = gr;
        if (warp) g.fillRect(x + 1, y, cell - 2, cell); else g.fillRect(x, y + 1, cell, cell - 2);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }
  // 트윌: 화면에서는 실 한 올보다 '사선 이랑'이 보여야 트윌로 읽힌다. 45도 사선 이랑(한 장에 8줄 → 이음매 없이 반복), 이랑 사이 골은 좁게.
  // 이랑 위 실 결까지 그리면 화면 픽셀과 겹쳐 잔 격자무늬(모아레)가 생겨 넣지 않는다
  function twillTexture() {
    const n = 128, p = 16, c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    const img = g.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const d = ((x + y) % p) / p; // 0~1: 이랑 하나 안의 위치
        const rib = Math.pow(Math.sin(Math.PI * d), 0.6); // 둥근 이랑, 골은 좁게
        const v = Math.round(255 * (0.28 + 0.52 * rib));
        const i = (y * n + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }
  const texLoader = new THREE.TextureLoader();
  const FABRIC = {
    oxford: { tex: weaveTexture(), scale: 0.075, amt: 0.11, bump: 0.55, rough: 0.74, sheen: 0.1, sheenRough: 0.6, sheenTone: 0.5, env: 0.4 },
    taslan: { tex: texLoader.load(stageBox.dataset.detailTaslan), scale: 0.14, amt: 0.2, bump: 0.45, rough: 0.9, sheen: 0.3, sheenRough: 0.9, sheenTone: 0.45, env: 0.3 },
    // 트윌(능직): 사선 이랑 간격 약 0.014(조끼 높이 2 기준, 실물보다 크게 그려야 화면에서 보인다). 무광 + 비스듬히 볼 때 은은한 잔털 광
    twill: { tex: twillTexture(), scale: 0.11, amt: 0.2, bump: 0.5, rough: 0.9, sheen: 0.4, sheenRough: 0.75, sheenTone: 0.42, env: 0.3 },
    // 폴리에스터: 가는 필라멘트 실의 촘촘한 평직(1/1). 결은 옅게, 거칠기는 옥스포드보다 낮게 해 매끈하고 은은한 광택(비닐처럼 번들거리지 않게)
    polyester: { tex: wovenTexture(128, 8, (i, j) => (i + j) % 2 === 0, '#777777', '#a9a9a9'), scale: 0.05, amt: 0.05, bump: 0.25, rough: 0.62, sheen: 0.2, sheenRough: 0.5, sheenTone: 0.5, env: 0.5 },
  };
  FABRIC.taslan.tex.wrapS = FABRIC.taslan.tex.wrapT = THREE.MirroredRepeatWrapping;
  FABRIC.taslan.tex.anisotropy = 8;

  // 원단 색 입히기 + 메쉬 구멍: 두 모델의 몸판 재질이 같은 uniform을 함께 쓴다
  const U = { uTint: { value: new THREE.Color(colorHex(state.color)) }, uTintOn: { value: 0 }, uMesh: { value: 0 }, uDetail: { value: 2.5 } };
  function fabricMaterial(src, fab) {
    const mat = new THREE.MeshPhysicalMaterial({
      map: src.map, normalMap: src.normalMap, normalScale: src.normalScale, side: src.side,
      roughness: fab.rough, metalness: 0, sheen: fab.sheen, sheenRoughness: fab.sheenRough, sheenColor: new THREE.Color(fab.sheenTone, fab.sheenTone, fab.sheenTone), envMapIntensity: fab.env,
    });
    const own = { uDTex: { value: fab.tex }, uDScale: { value: fab.scale }, uDAmt: { value: fab.amt }, uBump: { value: fab.bump } };
    mat.userData.own = own;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, own);
      sh.vertexShader = 'varying vec3 vNsP;\nvarying vec3 vNsN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvNsP = position;\nvNsN = objectNormal;');
      sh.fragmentShader = '#define MESH_BACK_TOP 0.585\n#define MESH_FRONT_SEAM -0.175\n#define MESH_BACK_SEAM -0.145\nuniform vec3 uTint;\nuniform float uTintOn;\nuniform float uMesh;\nuniform float uDetail;\nuniform sampler2D uDTex;\nuniform float uDScale;\nuniform float uDAmt;\nuniform float uBump;\nvarying vec3 vNsP;\nvarying vec3 vNsN;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
        '  float nsDH = 0.0;',
        '  float nsKeepAll = 0.0;',
        '#ifdef USE_MAP',
        '  vec4 sampledDiffuseColor = texture2D( map, vMapUv );',
        '  float nsL = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );',
        '  float nsKeep = smoothstep( 0.24, 0.40, nsL );', // 반사띠처럼 아주 밝은 곳만 원래 색
        '  nsKeepAll = nsKeep;',
        '  vec3 nsTint = uTint * clamp( 0.92 + nsL * uDetail, 0.0, 1.2 );',
        '  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, mix( nsTint, sampledDiffuseColor.rgb, nsKeep ), uTintOn );',
        '  vec3 nsA = abs( normalize( vNsN ) );',
        '  vec2 nsUV = ( nsA.z > nsA.x ? vNsP.xy : vNsP.zy ) / uDScale;',
        '  nsDH = texture2D( uDTex, nsUV ).r - 0.5;',
        '  sampledDiffuseColor.rgb *= 1.0 + nsDH * uDAmt * ( 1.0 - nsKeep );',
        '  diffuseColor *= sampledDiffuseColor;',
        '  if ( uMesh > 0.5 && ! gl_FrontFacing ) diffuseColor.rgb *= 0.3;', // 메쉬 구멍 너머로 보이는 옷 안쪽은 그늘져 어둡게(구멍이 또렷이 보이게)
        // 메쉬는 형광띠 밑 ~ 가로 절개선(주머니 위 경계)까지(2026-10-15 사용자 요청). 어깨·아랫단은 원단 그대로
        // 값은 모델 정면·뒷면 정사영 렌더에서 잰 몸판 좌표: 앞 형광띠 아래선 y = 0.66 - 0.28(|x| - 0.24), 뒤 반사띠 아래 0.63, 앞 절개선 -0.175, 뒤 절개선 -0.145
        // 2026-10-16 사용자 지적: 구김진 곳·옆구리에 구멍이 없었다(면 방향이 옆을 향하면 빼던 조건 때문).
        // → 앞·뒤 구분과 구멍 무늬를 면 방향(법선) 대신 위치로 정한다. 몸통 단면(가로 반폭 약 0.6, 앞뒤 약 0.48 타원)을 한 바퀴 도는 각도로
        //   구멍을 깔아 앞·옆구리·뒤가 끊김 없이 이어지고 구김에서도 빠지지 않는다(한 바퀴 210칸 = 앞뒤 칸 간격 약 0.018·옆구리 0.014, 줄 간격 0.017은 그대로)
        '  float nsFront = smoothstep( -0.12, 0.12, vNsP.z );', // 1 = 앞판, 0 = 뒷판, 옆구리는 그 사이로 이어서 절개선 높이를 잇는다
        '  float nsSeam = mix( MESH_BACK_SEAM, MESH_FRONT_SEAM, nsFront );',
        '  vec2 nsQ = vec2( atan( vNsP.x / 0.6, vNsP.z / 0.48 ) * ( 210.0 / 6.2831853 ), vNsP.y / 0.017 );',
        // 뒤는 구멍 줄의 가운데 높이로 판정해 위끝이 구멍이 잘리지 않는 일자 줄로 끝나게 한다(2026-10-15 사용자 요청: 뒤 반사띠 밑은 일자, 살짝 아래로)
        '  float nsY = vNsP.z > 0.0 ? vNsP.y : ( floor( nsQ.y ) + 0.5 ) * 0.017;',
        '  float nsTop = vNsP.z > 0.0 ? 0.62 - 0.28 * max( abs( vNsP.x ) - 0.24, 0.0 ) : MESH_BACK_TOP;', // 앞 형광띠는 바깥쪽으로 갈수록 내려가는 사선이라 그 아래선을 따라간다
        // 진동둘레·목 테두리처럼 몸통 바깥 방향과 거의 직각인 면(테두리 접힌 면)은 구멍 없이
        '  float nsBody = abs( dot( normalize( vec3( vNsP.x / 0.36, 0.0, vNsP.z / 0.2304 ) ), normalize( vNsN ) ) );',
        '  if ( uMesh > 0.5 && nsKeep < 0.5 && nsBody > 0.3 && nsY < nsTop && vNsP.y > nsSeam ) {',
        '    nsQ.x += 0.5 * mod( floor( nsQ.y ), 2.0 );',
        '    if ( length( fract( nsQ ) - 0.5 ) < 0.26 ) discard;',
        '  }',
        '#endif',
      ].join('\n')).replace('#include <normal_fragment_maps>', [
        '#include <normal_fragment_maps>',
        // 결 높이(nsDH)로 표면을 살짝 오돌토돌하게(범프). 반사띠에는 넣지 않는다
        '  {',
        '    vec2 nsDHxy = vec2( dFdx( nsDH ), dFdy( nsDH ) ) * uBump * 0.02 * ( 1.0 - nsKeepAll );',
        '    vec3 nsSX = dFdx( - vViewPosition ), nsSY = dFdy( - vViewPosition );',
        '    vec3 nsR1 = cross( nsSY, normal ), nsR2 = cross( normal, nsSX );',
        '    float nsDet = dot( nsSX, nsR1 ) * faceDirection;',
        '    vec3 nsGrad = sign( nsDet ) * ( nsDHxy.x * nsR1 + nsDHxy.y * nsR2 );',
        '    normal = normalize( abs( nsDet ) * normal - nsGrad );',
        '  }',
      ].join('\n'));
    };
    return mat;
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const urls = { oxford: stageBox.dataset.modelOxford, taslan: stageBox.dataset.modelTaslan };
  const models = {};
  const loading = {};
  const baseMats = []; // 옥스포드 모델의 몸판 재질: 옥스포드·메쉬·트윌·폴리에스터가 같이 쓰고 원단 값만 바꾼다
  function setFabric(key) {
    const fab = FABRIC[key];
    baseMats.forEach((mat) => {
      mat.roughness = fab.rough;
      mat.sheen = fab.sheen;
      mat.sheenRoughness = fab.sheenRough;
      mat.sheenColor.setScalar(fab.sheenTone);
      mat.envMapIntensity = fab.env;
      const own = mat.userData.own;
      own.uDTex.value = fab.tex; own.uDScale.value = fab.scale; own.uDAmt.value = fab.amt; own.uBump.value = fab.bump;
    });
  }
  let body = null; // 데칼을 붙일 몸판 메쉬(두 모델 모양이 같아 처음 것 하나로 계산)
  let size = null;
  const holder = new THREE.Group();
  scene.add(holder);

  function load(name) {
    if (models[name]) return Promise.resolve(models[name]);
    if (!loading[name]) {
      loading[name] = loader.loadAsync(urls[name]).then((gltf) => {
        const m = gltf.scene;
        m.traverse((o) => {
          if (!o.isMesh || !o.material || !o.material.map) return;
          // 타스란 원본 노멀맵은 UV 조각마다 결 방향이 달라 큰 얼룩(위장 무늬처럼)으로 보여 뺀다. 원본 거칠기·금속성 맵도 쓰지 않고 원단별 값(FABRIC)으로
          const src = o.material;
          if (name === 'taslan') src.normalMap = null;
          o.material = fabricMaterial(src, FABRIC[name]);
          if (name === 'oxford') baseMats.push(o.material);
        });
        if (!size) {
          const box = new THREE.Box3().setFromObject(m);
          size = box.getSize(new THREE.Vector3());
          holder.userData.center = box.getCenter(new THREE.Vector3());
        }
        m.position.sub(holder.userData.center);
        m.visible = false;
        holder.add(m);
        m.updateMatrixWorld(true);
        if (!body) m.traverse((o) => { if (!body && o.isMesh && o.material && o.material.map) body = o; });
        models[name] = m;
        return m;
      });
    }
    return loading[name];
  }

  try {
    await load('oxford');
  } catch (e) { setState('3D 모델을 불러오지 못했습니다.'); return; }

  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  let dist = 4;
  function frame() {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitH = radius / Math.sin(fov / 2);
    const fitW = fitH / Math.min(1, camera.aspect);
    dist = Math.max(fitH, fitW) * 1.35; // 위아래·좌우 여백
    const dir = camera.position.lengthSq() > 0 ? camera.position.clone().normalize() : new THREE.Vector3(0, 0.08, 1).normalize();
    camera.position.copy(dir.multiplyScalar(dist));
    camera.near = dist / 100; camera.far = dist * 10;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }
  camera.position.set(0, size.y * 0.08, 1);

  // 로고 데칼(비투비티 로고). 원단 색에 따라 apply()에서 텍스처를 바꾼다
  let logo;
  try { logo = await makeLogoTextures(THREE); } catch (e) { logo = makeFallbackLogo(THREE); }
  // 환경광 세기는 원단(옥스포드 0.4)과 맞춘다: 기본값 1이면 밝은 앞가슴에서 로고 색이 바래 보였다(2026-10-28 새 로고 그러데이션 확인 중 발견)
  const decalMat = new THREE.MeshStandardMaterial({ map: logo.reverse, transparent: true, roughness: 0.75, metalness: 0, envMapIntensity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const decals = {};
  const ray = new THREE.Raycaster();
  const hits = {}; // 로고 자리의 표면 점·바깥 방향(핫스팟 위치에도 씀)
  function hitFor(k) {
    if (hits[k] !== undefined) return hits[k];
    const s = LOGO_SPOTS[k];
    const front = s.side === 'front';
    ray.set(new THREE.Vector3(s.x * size.x * 0.5, s.y * size.y * 0.5, front ? 5 : -5), new THREE.Vector3(0, 0, front ? -1 : 1));
    const hit = ray.intersectObject(body, false)[0];
    hits[k] = hit ? { point: hit.point.clone(), normal: new THREE.Vector3(0, 0, front ? 1 : -1) } : null;
    return hits[k];
  }
  function decalFor(k) {
    if (decals[k] !== undefined) return decals[k];
    const s = LOGO_SPOTS[k];
    const front = s.side === 'front';
    const hit = hitFor(k);
    if (!hit) { decals[k] = null; return null; }
    const w = s.w * size.x * 0.5;
    const geo = new DecalGeometry(body, hit.point, new THREE.Euler(0, front ? 0 : Math.PI, 0), new THREE.Vector3(w, w / logo.aspect, 0.3));
    const mesh = new THREE.Mesh(geo, decalMat);
    mesh.renderOrder = 2;
    scene.add(mesh);
    decals[k] = mesh;
    return mesh;
  }

  // 앞/뒤로 카메라 돌리기
  let turn = null;
  let scrollAz = null; // 스크롤 연출이 정한 방향(라디안). null이면 쓰지 않음
  function turnTo(side) {
    scrollAz = null;
    const target = side === 'back' ? Math.PI : 0;
    const p = camera.position;
    const from = Math.atan2(p.x, p.z);
    let d = target - from;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 0.02) { turn = null; return; }
    if (reduceMotion) { setAzimuth(target); turn = null; return; }
    turn = { from, d, t0: performance.now(), ms: 900 };
  }
  function setAzimuth(a) {
    const p = camera.position;
    const r = Math.hypot(p.x, p.z);
    p.x = Math.sin(a) * r; p.z = Math.cos(a) * r;
    camera.lookAt(controls.target);
  }

  let applyToken = 0;
  async function apply(view) {
    const token = ++applyToken;
    const name = state.material === 'taslan' ? 'taslan' : 'oxford';
    if (!models[name]) {
      setState('재질을 불러오는 중입니다…');
      try { await load(name); } catch (e) { if (token === applyToken) setState('재질을 불러오지 못했습니다.'); return; }
      if (token !== applyToken) return;
    }
    // 시연이 다른 모델을 받는 중에 이미 받아 둔 재질을 누르면 위 블록을 건너뛰어 안내가 남던 문제(2026-10-28): 가장 최근 호출이 안내를 지운다
    if (token === applyToken) setState('');
    Object.keys(models).forEach((k) => { models[k].visible = k === name; });
    if (name === 'oxford') setFabric(state.material === 'twill' || state.material === 'polyester' ? state.material : 'oxford');
    U.uMesh.value = state.material === 'mesh' ? 1 : 0;
    U.uDetail.value = name === 'taslan' ? 0 : 2.5; // 타스란 원본 텍스처는 얼룩 명암이 커서 색을 입힐 때는 명암을 빼고 질감(노멀맵)만 남긴다
    U.uTintOn.value = state.color === 'black' ? 0 : 1;
    U.uTint.value.set(colorHex(state.color)); // Color.set이 sRGB 값을 선형으로 바꿔 준다
    // 원단별 로고(LOGO_LOOK): 밝은 원단 = 원래 색, 블랙·차콜·카키 = 색 B + 흰 글자, 파랑·보라가 묻히거나 부딪히는 원단 = 전체 흰색
    const c = new THREE.Color(colorHex(state.color));
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const look = LOGO_LOOK[state.color] || (lum > 0.4 ? 'color' : 'white');
    if (decalMat.map !== logo[look]) { decalMat.map = logo[look]; decalMat.needsUpdate = true; }
    if (logo.tint) decalMat.color.set(lum > 0.4 ? 0x1b1c1f : 0xffffff); else decalMat.color.set(0xffffff);
    Object.keys(LOGO_SPOTS).forEach((k) => {
      const on = state.logos.has(k);
      const m = on ? decalFor(k) : decals[k];
      if (m) m.visible = on;
    });
    // 보여 줄 쪽: 지정(front/back)이 있으면 그쪽, 시연(true)이면 로고가 많은 쪽
    let side = null;
    if (view === 'front' || view === 'back') side = view;
    else if (view === true) {
      const backs = Array.from(state.logos).filter((k) => LOGO_SPOTS[k].side === 'back').length;
      side = backs > state.logos.size - backs ? 'back' : 'front';
    }
    if (side) turnTo(side);
  }

  setState('');
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    frame();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, {}).observe(stage);

  // 회사명 글자 로고: 글자를 캔버스에 그려 데칼 텍스처로 쓴다. 빈 값이면 원래 로고로 되돌린다
  const brandLogo = logo;
  function clearDecals() {
    Object.keys(decals).forEach((k) => { const m = decals[k]; if (m) { scene.remove(m); m.geometry.dispose(); } delete decals[k]; });
  }
  async function setText(text) {
    const s = (text || '').trim().slice(0, 14);
    let next = brandLogo;
    if (s) {
      try { if (document.fonts && document.fonts.load) await document.fonts.load('800 160px "Pretendard Variable"', s); } catch (e) { /* 기본 글꼴로 그림 */ }
      const c = document.createElement('canvas');
      const g0 = c.getContext('2d');
      const font = '800 160px "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      g0.font = font;
      const tw = Math.ceil(g0.measureText(s).width);
      c.width = Math.max(260, tw + 48); c.height = 220;
      const g = c.getContext('2d');
      g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#fff';
      g.fillText(s, c.width / 2, 116);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      // 글자 수가 적어도 로고 높이가 지나치게 커지지 않게 가로:세로를 3 이상으로 본다
      next = { color: t, reverse: t, white: t, aspect: Math.max(3, c.width / c.height), tint: true, pad: c.width / c.height };
      if (next.pad < 3) { // 짧은 글자: 가로 3:1 캔버스 가운데에 다시 그림
        const c2 = document.createElement('canvas'); c2.width = c.height * 3; c2.height = c.height;
        const g2 = c2.getContext('2d'); g2.drawImage(c, (c2.width - c.width) / 2, 0);
        const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = 8;
        next.color = next.reverse = next.white = t2;
      }
    }
    if (logo !== brandLogo && logo.color && logo.color.dispose) logo.color.dispose();
    logo = next;
    clearDecals();
    decalMat.map = null;
    await apply(null);
  }
  api = { apply, turnTo, setText, isVisible: () => visible && !document.hidden,
    setScrollAz: (a) => { scrollAz = a; turn = null; },
    pause: (on) => { paused = !!on; }, // 검수 캡처용: 그리기를 잠시 멈춤
    // 검수 캡처용: 지금 장면을 그림 한 장으로 바꾸고 3D를 끈다(그래픽카드 없는 서버에서 화면 캡처가 멈추는 문제 회피)
    freeze: () => { controls.update(); renderer.render(scene, camera); placeHots(); const im = new Image(); im.src = renderer.domElement.toDataURL('image/png'); im.style.cssText = 'display:block;width:100%;height:100%'; renderer.setAnimationLoop(null); stage.replaceChild(im, renderer.domElement); renderer.forceContextLoss(); },
    jumpAz: (a) => { scrollAz = null; turn = null; setAzimuth(a); },
    setFree: (on) => { controls.enabled = !!on; if (stageBox) stageBox.classList.toggle('is-free', !!on); } };
  controls.enabled = false;
  let paused = false;

  // 핫스팟: 로고 자리 표면 점을 화면 좌표로 옮기고, 카메라 반대쪽(옷 뒤편)에 있으면 숨긴다
  const hotEls = optButtons('data-hot');
  const viewBtns = optButtons('data-view');
  const v3 = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  let lastSide = '';
  function placeHots() {
    const w = stage.clientWidth, h = stage.clientHeight;
    hotEls.forEach((el) => {
      const hit = hitFor(el.dataset.hot);
      if (!hit) { el.hidden = true; return; }
      toCam.copy(camera.position).sub(hit.point).normalize();
      const facing = toCam.dot(hit.normal) > 0.35;
      if (el.hidden === facing) el.hidden = !facing;
      if (!facing) return;
      v3.copy(hit.point).project(camera);
      el.style.transform = 'translate(' + ((v3.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v3.y) / 2 * h).toFixed(1) + 'px)';
    });
    const side = Math.cos(Math.atan2(camera.position.x, camera.position.z)) >= 0 ? 'front' : 'back';
    if (side !== lastSide) {
      lastSide = side;
      viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === side)));
    }
  }
  await apply(null);
  window.B2BTVest = { state, api, syncUI, LOGO_SPOTS };
  if (stageBox) stageBox.classList.add('is-ready');
  document.dispatchEvent(new CustomEvent('vest:ready'));
  /* v3: 자동 시연 없음. 스크롤 연출이 대신한다 */
  // 타스란은 첫 화면이 뜬 뒤 미리 받아 둔다
  (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(() => { load('taslan').catch(() => {}); });

  renderer.setAnimationLoop((now) => {
    if (!visible || document.hidden || paused) return;
    if (turn) {
      const t = Math.min(1, (now - turn.t0) / turn.ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setAzimuth(turn.from + turn.d * e);
      if (t >= 1) turn = null;
    } else if (scrollAz !== null) {
      const cur = Math.atan2(camera.position.x, camera.position.z);
      let d = scrollAz - cur;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) > 0.0008) setAzimuth(cur + d * (reduceMotion ? 1 : 0.14));
    }
    controls.update();
    renderer.render(scene, camera);
    placeHots();
  });
}

if (root && stage && stageBox) {
  bindPanel();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '400px 0px' });
    io.observe(root);
  } else {
    start();
  }
}
