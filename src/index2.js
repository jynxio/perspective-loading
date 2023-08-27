import '@/reset.css';
import Stats from 'stats.js';
import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';

let container, stats;

let camera, scene, renderer, effect;
let particleLight;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2500);
    camera.position.set(0, 0, 10);

    //

    scene = new three.Scene();
    scene.background = new three.Color(0x444488);

    //

    renderer = new three.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Materials
    const colors = new Uint8Array([0, 128]);
    const gradientMap = new three.DataTexture(colors, colors.length, 1, three.RedFormat);

    gradientMap.needsUpdate = true;

    const geometry = new three.SphereGeometry(1, 32, 16);
    const material = new three.MeshToonMaterial({ color: 0x8fa6c3, gradientMap });
    const mesh = new three.Mesh(geometry, material);

    scene.add(mesh);

    particleLight = new three.Mesh(new three.SphereGeometry(4, 8, 8), new three.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(particleLight);

    // Lights

    scene.add(new three.AmbientLight(0xc1c1c1, 3));

    const pointLight = new three.PointLight(0xffffff, 2, 800, 0);
    particleLight.add(pointLight);

    //

    effect = new OutlineEffect(renderer);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
    requestAnimationFrame(animate);

    stats.begin();
    render();
    stats.end();
}

function render() {
    const timer = Date.now() * 0.00025;

    particleLight.position.x = Math.sin(timer * 7) * 300;
    particleLight.position.y = Math.cos(timer * 5) * 400;
    particleLight.position.z = Math.cos(timer * 3) * 300;

    effect.render(scene, camera);
}
