import '@/reset.css';
import Stats from 'stats.js';
import earcut from 'earcut';
import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';

/* Camera */
const camera = new three.PerspectiveCamera(75, globalThis.innerWidth / globalThis.innerHeight, 0.01, 100);
camera.position.set(0, 0, 10);

/* Scene */
const scene = new three.Scene();

scene.add(camera);
scene.background = new three.Color(0x444488);

/* Renderer */
const canvas = document.createElement('canvas');
const renderer = new three.WebGLRenderer({ canvas, antialias: globalThis.devicePixelRatio < 2 });

document.body.prepend(canvas);
renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio, 2));
renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);

/* Controls */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* Stats */
const stats = new Stats();

stats.showPanel(0);
document.body.prepend(stats.dom);

/* Resize */
globalThis.addEventListener('resize', _ => {
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio, 2));
    renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);

    camera.aspect = globalThis.innerWidth / globalThis.innerHeight;
    camera.updateProjectionMatrix();
});

/* Render */
const effect = new OutlineEffect(renderer);
renderer.setAnimationLoop(function loop() {
    stats.begin();

    controls.update();
    effect.render(scene, camera);

    stats.end();
});

/* Sphere */
// const colors = new Uint8Array([0, 128]);
// const gradientMap = new three.DataTexture(colors, colors.length, 1, three.RedFormat);

// gradientMap.needsUpdate = true;

// const geometry = new three.SphereGeometry(1, 32, 16);
// const material = new three.MeshToonMaterial({ color: 0x8fa6c3, gradientMap });
// const mesh = new three.Mesh(geometry, material);

// scene.add(mesh);

/* Light */
const ambientLight = new three.AmbientLight(0xc1c1c1, 3);
const pointLight = new three.PointLight(0xffffff, 2, 800, 0);
const pointLightHelper = new three.Mesh(
    new three.SphereGeometry(0.1, 16, 16),
    new three.MeshBasicMaterial({ color: 0xffffff }),
);

pointLightHelper.add(pointLight);
scene.add(ambientLight, pointLightHelper);

requestAnimationFrame(function loop() {
    requestAnimationFrame(loop);

    const timer = Date.now() * 0.00025;

    pointLightHelper.position.x = Math.sin(timer * 7) * 3;
    pointLightHelper.position.y = Math.cos(timer * 5) * 4;
    pointLightHelper.position.z = Math.cos(timer * 3) * 3;
});

/*  */
// const segmentCount = 13;
// const directions = [];

// for (let i = 0; i < segmentCount; i++) {
//     const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
//     const sin = Math.sin(rad);
//     directions.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
// }

// // const temp = [-5, 0, -3, 0, -3, 2, -2, 2, -2, -2, -1, -2, -1, 3, 0, 3, 0, -3, 2, -3, 2, 2, 3, 2, 3, 0, 4, 0];
// const temp = [-5, 0, -3, 0, -3, 2];
// const positionArray = [];

// for (let i = 0; i < temp.length; i += 2) {
//     const x = temp[i + 0];
//     const z = temp[i + 1];

//     positionArray.push(x, 0.2, z);
// }

// for (let i = temp.length - 1; i >= 0; i -= 2) {
//     const x = temp[i - 1];
//     const z = temp[i - 0];
//     positionArray.push(x, -0.2, z);
// }

// console.log(positionArray); // earcut出错了，它不能剖一个异面多边形，你要把异面多边形拆开来给earcut处理 // TODO:

// const positionArray = [-1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0];
const positionArray = [1, 1, 0, 1, -1, 0, 0, 1, 0];
const positionAttribute = new three.BufferAttribute(new Float32Array(positionArray), 3);
const indexAttribute = new three.BufferAttribute(new Uint8Array(earcut(positionArray, null, 3)), 1);
const geometry = new three.BufferGeometry();
console.log(indexAttribute);
geometry.setAttribute('position', positionAttribute);
geometry.setIndex(indexAttribute);
geometry.computeVertexNormals();
geometry.computeBoundingSphere();
geometry.computeBoundingBox();

const colors = new Uint8Array([0, 128]);
const gradientMap = new three.DataTexture(colors, colors.length, 1, three.RedFormat);

gradientMap.needsUpdate = true;

const material = new three.MeshToonMaterial({ color: 0x8fa6c3, gradientMap, wireframe: false, side: three.DoubleSide });
const mesh = new three.Mesh(geometry, material);

scene.add(mesh);
