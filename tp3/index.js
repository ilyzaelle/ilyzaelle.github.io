import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// === Globals ===
let renderer, scene, camera, controls;
let globeGroup, globeMesh;
let raycaster, mouse, leafletMap;
const loader = new THREE.TextureLoader();
const pickables = []; // sprites cliquables (drapeaux)
const rad = THREE.MathUtils.degToRad;

// Petit état pour l'animation de focus caméra
let focusAnim = null;

// ===== Utils géo/projection =====
function latLonToCartesian(latDeg, lonDeg, r = 1) {
  // Convention Three.js: Y up ; SphereGeometry: phi=90-lat, theta=lon+180
  const phi = rad(90 - latDeg);
  const theta = rad(lonDeg + 180);
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const y =  r * Math.cos(phi);
  const z =  r * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// ===== Marqueurs =====
function addMarker(lat, lon, color = 0x00ff00, size = 0.03, radius = 1.02) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 16),
    new THREE.MeshBasicMaterial({ color })
  );
  m.position.copy(latLonToCartesian(lat, lon, radius));
  globeGroup.add(m);
  return m;
}

function addFlagSprite(lat, lon, flagUrl, size = 0.06, radius = 1.06, label = '') {
  const tex = loader.load(flagUrl);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: true
  }));
  sprite.scale.set(size, size, size);
  sprite.position.copy(latLonToCartesian(lat, lon, radius));
  sprite.userData = { lat, lon, label };
  globeGroup.add(sprite);
  pickables.push(sprite);
  return sprite;
}

// ===== Focus caméra (globe fixe, nord en haut) =====
function focusCameraOn(lat, lon, distance) {
  const n = latLonToCartesian(lat, lon, 1).normalize();

  // distance actuelle si non fournie
  const currentDist = camera.position.length() || 3.2;
  const dst = (typeof distance === 'number') ? distance : currentDist;

  const targetPos = n.clone().multiplyScalar(dst);

  // init/replace animation
  focusAnim = {
    start: camera.position.clone(),
    end: targetPos,
    t: 0,             // 0..1
    dur: 0.6          // secondes (approximatif)
  };
}

// Easing cubic
function easeInOutCubic(u){ return u<0.5 ? 4*u*u*u : 1 - Math.pow(-2*u+2,3)/2; }

// ===== Init =====
init();
animate();

async function init() {
  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // SCENE + CAMERA
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 3.2);
  camera.up.set(0, 1, 0); // Nord = haut écran

  // CONTROLS
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.5;
  controls.maxDistance = 6;
  controls.target.set(0, 0, 0);

  // LUMIÈRES
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 3, 5);
  scene.add(dir);

  // Groupe Globe (reste FIXE)
  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Terre
  const globeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
  globeMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), globeMat);
  globeGroup.add(globeMesh);

  // Textures (CORS-safe)
  const diffuse = 'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg';
  const bump    = 'https://threejs.org/examples/textures/earthbump1k.jpg';
  loader.load(diffuse, t => { t.anisotropy = 8; globeMat.map = t; globeMat.needsUpdate = true; });
  loader.load(bump,    t => { t.anisotropy = 8; globeMat.bumpMap = t; globeMat.bumpScale = 0.02; globeMat.needsUpdate = true; });

  // Atmosphère
  globeGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x5ea8ff, transparent: true, opacity: 0.1 })
  ));

  // Etoiles (ambiance)
  const stars = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.005 }));
  const N=1200, pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){ const r=40+Math.random()*20, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph); pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);}
  stars.geometry.setAttribute('position', new THREE.BufferAttribute(pos,3));
  scene.add(stars);

  // Geoloc utilisateur (marqueur vert)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => addMarker(p.coords.latitude, p.coords.longitude, 0x00ff00),
      () => addMarker(48.8566, 2.3522, 0x00ff00),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  // Raycaster pour clics 3D
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // Leaflet
  setupLeaflet();

  // Pays (drapeaux + markers Leaflet)
  await addCountries();

  // Démarrage: cadrage global
  focusCameraOn(20, 0); // Afrique du Nord / Europe

  // Resize
  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== Leaflet =====
function setupLeaflet() {
  leafletMap = L.map('map', { zoomControl: true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 6, attribution: '&copy; OpenStreetMap'
  }).addTo(leafletMap);

  // Clic carte -> focus caméra 3D
  leafletMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    focusCameraOn(lat, lng);
  });
}

// ===== Données pays =====
async function addCountries() {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,latlng,flags');
    const data = await res.json();

    const subset = data.filter(c => Array.isArray(c.latlng)).slice(0, 160);

    subset.forEach(c => {
      const [lat, lon] = c.latlng;
      const flag = (c.flags && (c.flags.png || c.flags.svg)) || '';
      addFlagSprite(lat, lon, flag, 0.055, 1.06, c.name?.common || '');

      const mk = L.marker([lat, lon]).addTo(leafletMap).bindTooltip(c.name?.common || '', {permanent:false});
      mk.on('click', () => focusCameraOn(lat, lon));
    });
  } catch (e) {
    console.warn('restcountries KO:', e);
  }
}

// ===== Picking 3D -> recentrer Leaflet & caméra =====
function onPointerDown(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length) {
    const obj = hits[0].object;
    const { lat, lon } = obj.userData || {};
    if (typeof lat === 'number' && typeof lon === 'number') {
      leafletMap.setView([lat, lon], 4, { animate: true });
      focusCameraOn(lat, lon);
    }
  }
}

// ===== Boucle =====
let lastTime = performance.now();
function animate() {
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp delta
    lastTime = now;

    // Animation de focus caméra
    if (focusAnim) {
      const speed = 1 / (focusAnim.dur || 0.6);
      focusAnim.t = Math.min(1, focusAnim.t + dt * speed);
      const u = easeInOutCubic(focusAnim.t);
      const pos = focusAnim.start.clone().lerp(focusAnim.end, u);
      camera.position.copy(pos);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      if (focusAnim.t >= 1) focusAnim = null;
    }

    controls.update();
    renderer.render(scene, camera);
  });
}
