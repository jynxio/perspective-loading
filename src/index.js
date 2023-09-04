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

const segmentGeometry = new three.PlaneGeometry(1, 1);
const segmentBrightBlueMaterial = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });
const segmentDimBlueMaterial = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });
const segmentBrightWhiteMaterial = new three.MeshBasicMaterial({ color: 0xfffffff, side: three.DoubleSide });
const segmentDimWhiteMaterial = new three.MeshBasicMaterial({ color: 0xc6c6c6, side: three.DoubleSide });
const segmentBlueMeshs = [];
const segmentWhiteMeshs = [];

for (let i = 0; i < segmentCount; i++) {
    const mb = new three.Mesh(segmentGeometry, i % 2 === 0 ? segmentBrightBlueMaterial : segmentDimBlueMaterial);
    const mw = new three.Mesh(segmentGeometry, i % 2 === 0 ? segmentBrightWhiteMaterial : segmentDimWhiteMaterial);

    if (segmentDirections[i] === 0) {
        mb.userData.currentScaleX = mw.userData.currentScaleX = Math.random() * 5 + 1;
    } else {
        mb.userData.currentScaleX = mw.userData.currentScaleX = 0;
        mb.userData.nextScaleX = mw.userData.nextScaleX = Math.random() * 5 + 1;
    }

    segmentBlueMeshs.push(mb);
    segmentWhiteMeshs.push(mw);
}

//
const outlineGeometry = new LineGeometry();
const outlineMaterial = new LineMaterial({ color: 0x000000, linewidth: 0.05, worldUnits: true });

outlineMaterial.needsUpdate = true; // TODO: ?

const outline = new Line2(outlineGeometry, outlineMaterial);

//
const segmentBlueGroup = new three.Group().add(...segmentBlueMeshs);
const segmentWhiteGroup = new three.Group().add(...segmentWhiteMeshs);
const loading = new three.Group().add(outline, segmentWhiteGroup, segmentBlueGroup);

outline.renderOrder = 0;
segmentWhiteGroup.renderOrder = 1;
segmentBlueGroup.renderOrder = 2;
scene.add(loading);

//
toggleLoading();
loading.position.sub(outlineGeometry.boundingSphere.center);

globalThis.f = toggleLoading; // TODO:
globalThis.j = scaleLoading; // TODO:
globalThis.a = () => {
    let scale = 0;
    const duration = 3000;
    const start = performance.now();

    requestAnimationFrame(function loop() {
        scale = (performance.now() - start) / duration;
        scaleLoading(Math.min(scale, 1));

        if (scale >= 1) return;

        requestAnimationFrame(loop);
    });
};

//
function toggleLoading() {
    [segmentBlueMeshs, segmentWhiteMeshs].forEach(meshs => {
        meshs.forEach((m, i) => {
            if (typeof m.userData.nextScaleX === 'number') {
                const temp = m.userData.currentScaleX;

                m.userData.currentScaleX = m.userData.nextScaleX;
                m.userData.nextScaleX = temp;
            }

            m.scale.set(m.userData.currentScaleX, 1, 1);
            m.rotation.set(0, (segmentDirections[i] * Math.PI) / 2, 0);
            m.updateMatrix();

            if (i === 0) return;

            const prevM = segmentBlueMeshs[i - 1];
            const nextM = m;
            const prevV = new three.Vector3(0.5, 0.5, 0).applyMatrix4(prevM.matrix);
            const nextV = new three.Vector3(-0.5, 0.5, 0).applyMatrix4(nextM.matrix);

            nextM.position.add(prevV.clone().sub(nextV));
            nextM.updateMatrix();
        });
    });

    const vs = [new three.Vector3(-0.5, 0.5, 0).applyMatrix4(segmentWhiteMeshs[0].matrix)];

    for (let i = 0; i < segmentCount; i++)
        vs.push(new three.Vector3(0.5, 0.5, 0).applyMatrix4(segmentWhiteMeshs[i].matrix));
    for (let i = segmentCount - 1; i >= 0; i--)
        vs.push(new three.Vector3(0.5, -0.5, 0).applyMatrix4(segmentWhiteMeshs[i].matrix));

    vs.push(new three.Vector3(-0.5, -0.5, 0).applyMatrix4(segmentWhiteMeshs[0].matrix));
    vs.push(vs[0].clone());

    const outlinePositions = [];

    for (const v of vs) outlinePositions.push(...v.toArray());

    outlineGeometry.setPositions(outlinePositions);
    outlineGeometry.computeBoundingBox();
    outlineGeometry.computeBoundingSphere();
}

function scaleLoading(percentage) {
    const segmentMeshLengths = segmentBlueMeshs.map(m => m.geometry.parameters.width * m.userData.currentScaleX);
    const totalLength = segmentMeshLengths.reduce((prev, next) => prev + next, 0);

    const currentLength = totalLength * percentage;

    let reduceLength = 0;
    let currentIndex;

    for (let i = 0; i < segmentMeshLengths.length; i++) {
        reduceLength += segmentMeshLengths[i];

        if (reduceLength < currentLength) continue;

        currentIndex = i;
        break;
    }

    // reset
    segmentBlueMeshs.forEach(m => {
        if (!m.userData.offsetX) return;

        m.translateX(-m.userData.offsetX);
        m.userData.offsetX = 0;
    });

    // translate
    const scale =
        (currentLength - (reduceLength - segmentMeshLengths[currentIndex])) / segmentMeshLengths[currentIndex];

    for (let i = 0; i < currentIndex; i++) {
        const m = segmentBlueMeshs[i];

        m.scale.set(m.userData.currentScaleX, 1, 1);
    }

    segmentBlueMeshs[currentIndex].scale.set(segmentBlueMeshs[currentIndex].userData.currentScaleX * scale, 1, 1);
    segmentBlueMeshs[currentIndex].translateX(
        (-segmentBlueMeshs[currentIndex].userData.currentScaleX * (1 - scale)) / 2,
    );
    segmentBlueMeshs[currentIndex].userData.offsetX =
        (-segmentBlueMeshs[currentIndex].userData.currentScaleX * (1 - scale)) / 2;

    for (let i = currentIndex + 1; i < segmentBlueMeshs.length; i++) {
        const m = segmentBlueMeshs[i];

        m.scale.set(0, 1, 1);
    }
}
