import '@/reset.css';
import Stats from 'stats.js';
import earcut from 'earcut';
import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

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
renderer.autoClear = false;
renderer.autoClearColor = false;
renderer.autoClearDepth = false;
renderer.autoClearStencil = false;
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
renderer.setAnimationLoop(function loop() {
    stats.begin();

    renderer.clearColor();
    renderer.clearStencil();

    controls.update();
    scene.remove(fatLine).add(loading);
    renderer.render(scene, camera);

    renderer.clearDepth();

    scene.remove(loading).add(fatLine);
    renderer.render(scene, camera);

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
const segmentCount = 13;
const directions = []; // 0 -> 0, 1 -> 90, -1 -> -90

for (let i = 0; i < segmentCount; i++) {
    const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
    const sin = Math.sin(rad);

    directions.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
}

//
const geometries = [];

for (let i = 0; i < segmentCount; i++) {
    geometries.push(new three.PlaneGeometry(1, 1)); // TODO: 使用InstanceGeometry
}

//
const colors = new Uint8Array([0, 128]);
const gradientMap = new three.DataTexture(colors, colors.length, 1, three.RedFormat);

gradientMap.needsUpdate = true;

const material = new three.MeshToonMaterial({ color: 0x8fa6c3, gradientMap, wireframe: false, side: three.DoubleSide });

//
const meshs = geometries.map(g => new three.Mesh(g, material));

meshs.forEach((mesh, index) => {
    //
    mesh.scale.setY(0.4).setX(Math.random() * 3 + 1);
    mesh.rotateY((directions[index] * Math.PI) / 2);
    mesh.updateMatrix();

    //
    if (index === 0) return;

    const prevMesh = meshs[index - 1];
    const prevVector3 = new three.Vector3(0.5, 0.5, 0).applyMatrix4(prevMesh.matrix);
    const nextVector3 = new three.Vector3(-0.5, 0.5, 0).applyMatrix4(mesh.matrix);

    mesh.position.add(prevVector3.clone().sub(nextVector3));
    mesh.updateMatrix();
});

const loading = new three.Group().add(...meshs);

//
const points = [];

points.push(new three.Vector3(-0.5, 0.5, 0).applyMatrix4(meshs[0].matrix));
meshs.forEach(mesh => points.push(new three.Vector3(0.5, 0.5, 0).applyMatrix4(mesh.matrix)));
[...meshs].reverse().forEach(mesh => points.push(new three.Vector3(0.5, -0.5, 0).applyMatrix4(mesh.matrix)));
points.push(new three.Vector3(-0.5, -0.5, 0).applyMatrix4(meshs[0].matrix));
points.push(points[0]);

const linePositions = [];

for (const point of points) {
    linePositions.push(...point.toArray());
}

const line = new three.Line(
    new three.BufferGeometry().setFromPoints(points),
    new three.MeshBasicMaterial({ color: 0xff0000 }),
);

const fatLineGeometry = new LineGeometry().setPositions(linePositions);
const fatLineMaterial = new LineMaterial({
    color: 0x000000,
    linewidth: 0.05,
    vertexColors: false,
    dashed: false,
    alphaToCoverage: false,
});
fatLineMaterial.worldUnits = true;
fatLineMaterial.needsUpdate = true;

const fatLine = new Line2(fatLineGeometry, fatLineMaterial);
