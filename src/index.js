import '@/reset.css';
import Stats from 'stats.js';
import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

// TODO: 记笔记
// const colors = new Uint8Array([0, 128]);
// const gradientMap = new three.DataTexture(colors, colors.length, 1, three.RedFormat);
// gradientMap.needsUpdate = true;
// const material = new three.MeshToonMaterial({gradientMap})

/**
 * Base
 */
const scene = new three.Scene();
scene.background = new three.Color(0xe2e0e2);

const perspectiveCamera = new three.PerspectiveCamera(45, globalThis.innerWidth / globalThis.innerHeight, 0.01, 1000);

perspectiveCamera.position.set(0, 0, 25);
scene.add(perspectiveCamera);

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
});

renderer.setAnimationLoop(function loop() {
    stats.begin();

    controls.update();
    renderer.render(scene, perspectiveCamera);

    stats.end();
});

/*  */
//
const segmentCount = 13; // loading的段数
const segmentDirections = []; // 每一段的方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

for (let i = 0; i < segmentCount; i++) {
    const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
    const sin = Math.sin(rad);

    segmentDirections.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
}

const segmentGeometries = new Array(segmentCount).fill(new three.PlaneGeometry(1, 1)); // TODO: 使用InstanceGeometry
const segmentBrightMaterial = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });
const segmentDimMaterial = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });
const segmentMeshs = segmentGeometries.map((g, i) => {
    const m = new three.Mesh(g, i % 2 === 0 ? segmentBrightMaterial : segmentDimMaterial);

    if (segmentDirections[i] === 0) {
        m.userData.currentScaleX = Math.random() * 5 + 1;
    } else {
        m.userData.currentScaleX = 0;
        m.userData.nextScaleX = Math.random() * 5 + 1;
    }

    return m;
});

//
const outlineGeometry = new LineGeometry();
const outlineMaterial = new LineMaterial({ color: 0x000000, linewidth: 0.05, worldUnits: true });

outlineMaterial.needsUpdate = true; // TODO: ?

const outline = new Line2(outlineGeometry, outlineMaterial);

//
const segmentGroup = new three.Group().add(...segmentMeshs);
const loading = new three.Group().add(segmentGroup, outline);

scene.add(loading);

//
toggleLoading();
loading.position.sub(outlineGeometry.boundingSphere.center);

globalThis.f = toggleLoading;

//
function toggleLoading() {
    segmentMeshs.forEach((m, i) => {
        if (typeof m.userData.nextScaleX === 'number') {
            const temp = m.userData.currentScaleX;

            m.userData.currentScaleX = m.userData.nextScaleX;
            m.userData.nextScaleX = temp;
        }

        m.scale.set(m.userData.currentScaleX, 1, 1);
        m.rotation.set(0, (segmentDirections[i] * Math.PI) / 2, 0);
        m.updateMatrix();

        if (i === 0) return;

        const prevM = segmentMeshs[i - 1];
        const nextM = m;
        const prevV = new three.Vector3(0.5, 0.5, 0).applyMatrix4(prevM.matrix);
        const nextV = new three.Vector3(-0.5, 0.5, 0).applyMatrix4(nextM.matrix);

        nextM.position.add(prevV.clone().sub(nextV));
        nextM.updateMatrix();
    });

    const vs = [new three.Vector3(-0.5, 0.5, 0).applyMatrix4(segmentMeshs[0].matrix)];

    for (let i = 0; i < segmentCount; i++) vs.push(new three.Vector3(0.5, 0.5, 0).applyMatrix4(segmentMeshs[i].matrix));
    for (let i = segmentCount - 1; i >= 0; i--)
        vs.push(new three.Vector3(0.5, -0.5, 0).applyMatrix4(segmentMeshs[i].matrix));

    vs.push(new three.Vector3(-0.5, -0.5, 0).applyMatrix4(segmentMeshs[0].matrix));
    vs.push(vs[0].clone());

    const outlinePositions = [];

    for (const v of vs) outlinePositions.push(...v.toArray());

    outlineGeometry.setPositions(outlinePositions);
    outlineGeometry.computeBoundingBox();
    outlineGeometry.computeBoundingSphere();
}
