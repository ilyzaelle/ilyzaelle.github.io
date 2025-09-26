import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const light = new THREE.AmbientLight(0xffffff, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true });

camera.position.z = 5;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.2, roughness: 0.6 });
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);
light.position.set(3, 5, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
    }
    get min() { return this.obj[this.minProp]; }
    set min(v) {
        this.obj[this.minProp] = Math.max(0.0001, v); // clamp near > 0
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], this.obj[this.minProp] + this.minDif);
    }
    get max() { return this.obj[this.maxProp]; }
    set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min; // enforce min <= max - minDif
    }
}

function updateCamera() {
    camera.updateProjectionMatrix();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

const gui = new GUI();
gui.add(camera, 'fov', 1, 120, 1).onChange(updateCamera);
const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
gui.add(minMaxGUIHelper, 'min', 0.01, 50, 0.01).name('near').onChange(updateCamera);
gui.add(minMaxGUIHelper, 'max', 0.1, 2000, 0.1).name('far').onChange(updateCamera);

renderer.setAnimationLoop(() => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
});


const texLoader = new THREE.TextureLoader();

const colorTex = await texLoader.loadAsync('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

colorTex.colorSpace = THREE.SRGBColorSpace;           // couleurs correctes
colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping;
colorTex.repeat.set(1, 1);
colorTex.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy()
);


cube.material = new THREE.MeshStandardMaterial({
    map: colorTex,
    metalness: 0.2,
    roughness: 0.7,
});