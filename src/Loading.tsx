import * as three from 'three';
import { useControls } from 'leva';

function Loading() {
    //
    const { isTilt } = useControls({ isTilt: false });

    //
    const segmentCount = 13; // loading的段数
    const segmentDirections: number[] = []; // 每一段的方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

    for (let i = 0; i < segmentCount; i++) {
        const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
        const sin = Math.sin(rad);

        segmentDirections.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
    }

    //
    const segmentGeometry = new three.PlaneGeometry(1, 1);
    const segmentIdleDimMaterial = new three.MeshBasicMaterial({ color: 0xc6c6c6, side: three.DoubleSide });
    const segmentIdleBrightMaterial = new three.MeshBasicMaterial({ color: 0xffffff, side: three.DoubleSide });
    const segmentloadedDimMaterial = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });
    const segmentLoadedBrightMaterial = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });

    const segmentLoadedMeshs = [];
    const segmentIdleMeshs = [];

    for (let i = 0; i < segmentCount; i++) {
        const loadedMesh = new three.Mesh(
            segmentGeometry,
            i % 2 === 0 ? segmentLoadedBrightMaterial : segmentloadedDimMaterial,
        );
        const idleMesh = new three.Mesh(
            segmentGeometry,
            i % 2 === 0 ? segmentIdleBrightMaterial : segmentIdleDimMaterial,
        );

        if (segmentDirections[i] === 0) {
            const random = Math.random() * 5 + 1;

            idleMesh.userData = { tiltViewScaleX: random, frontViewScaleX: random };
            loadedMesh.userData = { tiltViewScaleX: random, frontViewScaleX: random };
        } else {
            const random = Math.random() * 5 + 1;

            idleMesh.userData = { tiltViewScaleX: random, frontViewScaleX: 0 };
            loadedMesh.userData = { tiltViewScaleX: random, frontViewScaleX: 0 };
        }

        segmentLoadedMeshs.push(loadedMesh);
        segmentIdleMeshs.push(idleMesh);
    }

    if (isTilt) {
        turnToTiltView(segmentLoadedMeshs, segmentDirections);
        turnToTiltView(segmentIdleMeshs, segmentDirections);
    } else {
        turnToFrontView(segmentLoadedMeshs, segmentDirections);
        turnToFrontView(segmentIdleMeshs, segmentDirections);
    }

    //
    return (
        <group>
            {segmentLoadedMeshs.map(mesh => (
                <primitive object={mesh} key={mesh.uuid} />
            ))}
            {segmentIdleMeshs.map(mesh => (
                <primitive object={mesh} key={mesh.uuid} />
            ))}
        </group>
    );
}

function turnToTiltView(meshs: three.Mesh[], directions: number[]) {
    meshs.forEach((m, i) => {
        m.scale.set(m.userData.tiltViewScaleX, 1, 1);
        m.rotation.set(0, (directions[i] * Math.PI) / 2, 0);
        m.updateMatrix();

        if (i === 0) return;

        const prevM = meshs[i - 1];
        const nextM = m;
        const prevV = new three.Vector3(0.5, 0.5, 0).applyMatrix4(prevM.matrix);
        const nextV = new three.Vector3(-0.5, 0.5, 0).applyMatrix4(nextM.matrix);

        nextM.position.add(prevV.clone().sub(nextV));
        nextM.updateMatrix();
    });
}

function turnToFrontView(meshs: three.Mesh[], directions: number[]) {
    meshs.forEach((m, i) => {
        m.scale.set(m.userData.frontViewScaleX, 1, 1);
        m.rotation.set(0, (directions[i] * Math.PI) / 2, 0);
        m.updateMatrix();

        if (i === 0) return;

        const prevM = meshs[i - 1];
        const nextM = m;
        const prevV = new three.Vector3(0.5, 0.5, 0).applyMatrix4(prevM.matrix);
        const nextV = new three.Vector3(-0.5, 0.5, 0).applyMatrix4(nextM.matrix);

        nextM.position.add(prevV.clone().sub(nextV));
        nextM.updateMatrix();
    });
}

function setPercentage(meshs: three.Mesh[], percentage: number) {
    const lengths = meshs.map(m => m.geometry.parameters.width * m.userData.currentScaleX);
}

export default Loading;
