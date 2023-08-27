import '@/reset.css';
import Stats from 'stats.js';
import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

/**
 * Base
 */
const scene = new three.Scene();
scene.background = new three.Color(0xe2e0e2);

const perspectiveCamera = new three.PerspectiveCamera(75, globalThis.innerWidth / globalThis.innerHeight, 0.01, 1000);

perspectiveCamera.position.set(0, 0, 10);
scene.add(perspectiveCamera);

const aspectRatio = globalThis.innerHeight / globalThis.innerWidth;
const orthographicCamera = new three.OrthographicCamera(-20 * aspectRatio, 20 * aspectRatio, 20, -20, 0.01, 1000);

orthographicCamera.position.set(0, 0, 20);
scene.add(orthographicCamera);

const canvas = document.createElement('canvas');
document.body.prepend(canvas);

const renderer = new three.WebGLRenderer({ canvas, antialias: globalThis.devicePixelRatio < 2 });

renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio, 2));
renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);

const controls = new OrbitControls(perspectiveCamera, renderer.domElement);
controls.enableDamping = true;

const stats = new Stats();

stats.showPanel(0);
document.body.prepend(stats.dom);

globalThis.addEventListener('resize', () => {
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio, 2));
    renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);

    perspectiveCamera.aspect = globalThis.innerWidth / globalThis.innerHeight;
    perspectiveCamera.updateProjectionMatrix();

    const aspectRatio = globalThis.innerHeight / globalThis.innerWidth;

    orthographicCamera.left = -20 * aspectRatio;
    orthographicCamera.right = 20 * aspectRatio;
});

renderer.setAnimationLoop(function loop() {
    stats.begin();

    controls.update();
    renderer.render(scene, perspectiveCamera);

    stats.end();
});

/*  */
const segmentCount = 13; // loading的段数
const directions = []; // 每一段的方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

for (let i = 0; i < segmentCount; i++) {
    const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
    const sin = Math.sin(rad);

    directions.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
}

//
const geometries = new Array(segmentCount).fill(new three.PlaneGeometry(1, 1)); // TODO: 使用InstanceGeometry

//
// TODO: 记笔记
// const colors = new Uint8Array([0, 128]);
// const gradientMap = new three.DataTexture(colors, colors.length, 1, three.RedFormat);
// gradientMap.needsUpdate = true;
// const material = new three.MeshToonMaterial({gradientMap})

const materialBright = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });
const materialDim = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });

//
const meshs = geometries.map((geometry, index) => {
    const material = index % 2 === 0 ? materialBright : materialDim;
    const mesh = new three.Mesh(geometry, material);

    return mesh;
});

meshs.forEach((mesh, index) => {
    //
    mesh.scale.setY(0.5).setX(Math.random() * 3 + 1);
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

const plane = new three.Group().add(...meshs);
scene.add(plane);

//
const points = [];

points.push(new three.Vector3(-0.5, 0.5, 0).applyMatrix4(meshs[0].matrix));
meshs.forEach(mesh => points.push(new three.Vector3(0.5, 0.5, 0).applyMatrix4(mesh.matrix)));
[...meshs].reverse().forEach(mesh => points.push(new three.Vector3(0.5, -0.5, 0).applyMatrix4(mesh.matrix)));
points.push(new three.Vector3(-0.5, -0.5, 0).applyMatrix4(meshs[0].matrix));
points.push(points[0]);

const linePositions = [];
for (const point of points) linePositions.push(...point.toArray());

const line = new three.Line(
    new three.BufferGeometry().setFromPoints(points),
    new three.MeshBasicMaterial({ color: 0xff0000 }),
);

const fatLineGeometry = new LineGeometry().setPositions(linePositions);
const fatLineMaterial = new LineMaterial({
    color: 0x000000,
    linewidth: 0.02,
    vertexColors: false,
    dashed: false,
    alphaToCoverage: false,
});
fatLineMaterial.worldUnits = true;
fatLineMaterial.needsUpdate = true;

const outline = new Line2(fatLineGeometry, fatLineMaterial);

//
const loading = new three.Group().add(plane, outline);
scene.add(loading);

//
const box3 = new three.Box3().setFromPoints(points);
loading.position.sub(box3.getCenter(new three.Vector3()));
