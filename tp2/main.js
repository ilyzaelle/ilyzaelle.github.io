import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let renderer, scene, camera, controls;
let model;                 // le modèle glTF chargé
let useDeviceOrientation = false;
const eulerTarget = new THREE.Euler(); // orientation cible via capteurs
const rad = THREE.MathUtils.degToRad;

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
    scene.background = new THREE.Color(0x0b1020);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2.5, 1.6, 3.0);

    // CONTROLS (souris/touch)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // LUMIÈRES
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(3, 5, 2);
    scene.add(dir);

    // SOL
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0x202733, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // CHARGER UN MODÈLE 3D (GLTF/GLB)
    // Exemples légers : Duck.glb / DamagedHelmet.glb
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync(
            'https://threejs.org/examples/models/gltf/Duck/glTF-Binary/Duck.glb'
        );
        model = gltf.scene;
        model.position.set(0, 0, 0);
        model.traverse(o => { if (o.isMesh) o.castShadow = true; });
        scene.add(model);
    } catch (err) {
        console.error('Erreur de chargement GLTF:', err);

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshStandardMaterial({ color: 0x44aa88, roughness: .6, metalness: .1 })
        );
        model = mesh;
        scene.add(model);
    }

    window.addEventListener('resize', onResize);

    const btn = document.getElementById('enableSensors');
    btn.addEventListener('click', async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response !== 'granted') return alert('Permission refusée.');
            } catch {
                return alert('Permission capteurs non accordée.');
            }
        }
        startDeviceEvents();
        btn.style.display = 'none';
    });

    if (!('DeviceOrientationEvent' in window)) {
        document.getElementById('enableSensors').style.display = 'none';
    }
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startDeviceEvents() {
    useDeviceOrientation = true;

    window.addEventListener('deviceorientation', (ev) => {
        const { alpha, beta, gamma } = ev;
        if (alpha == null || beta == null || gamma == null) return;
        // Mapping simple vers l'Euler du modèle
        eulerTarget.set(rad(beta), rad(alpha), rad(-gamma), 'XYZ');
    }, true);

    window.addEventListener('devicemotion', (ev) => {
        if (!model || !ev.accelerationIncludingGravity) return;
        const a = ev.accelerationIncludingGravity;
        const mag = Math.min(1.0, Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z) / 20);
        model.position.y = mag * 0.2; // petite translation selon l’activité
    }, true);
}

function animate() {
    renderer.setAnimationLoop(() => {
        if (model) {
            if (useDeviceOrientation) {
                // interpolation douce vers l'orientation issue des capteurs
                model.rotation.x += (eulerTarget.x - model.rotation.x) * 0.15;
                model.rotation.y += (eulerTarget.y - model.rotation.y) * 0.15;
                model.rotation.z += (eulerTarget.z - model.rotation.z) * 0.15;
            } else {
                // fallback: rotation automatique si capteurs non actifs
                model.rotation.y += 0.01;
            }
        }
        controls.update();
        renderer.render(scene, camera);
    });
}
