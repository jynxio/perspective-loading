import * as three from 'three';
import { useEffect, useMemo, useState } from 'react';
import { useControls } from 'leva';
import { Line } from '@react-three/drei';

function Loading() {
    //
    const { isTilt, percentage } = useControls({ isTilt: true, percentage: { value: 78, min: 0, max: 100, step: 1 } });

    //
    const [vector3s, setVector3s] = useState<three.Vector3[]>();
    const [position, setPosition] = useState<[number, number, number]>();

    //
    const { loadedBoard, idleBoard } = useMemo(() => {
        //
        const segmentCount = 13; // loading的段数
        const segmentDirections: number[] = []; // 每一段的方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

        for (let i = 0; i < segmentCount; i++) {
            const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
            const sin = Math.sin(rad);

            segmentDirections.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
        }

        console.log(segmentDirections);

        //
        const segmentGeometry = new three.PlaneGeometry(1, 1);
        const segmentIdleDimMaterial = new three.MeshBasicMaterial({ color: 0xc6c6c6, side: three.DoubleSide });
        const segmentIdleBrightMaterial = new three.MeshBasicMaterial({ color: 0xffffff, side: three.DoubleSide });
        const segmentloadedDimMaterial = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });
        const segmentLoadedBrightMaterial = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });

        const segmentLoadedMeshs = [];
        const segmentIdleMeshs = [];

        for (let i = 0; i < segmentCount; i++) {
            const idleMaterial = i % 2 === 0 ? segmentIdleBrightMaterial : segmentIdleDimMaterial;
            const loadedMaterial = i % 2 === 0 ? segmentLoadedBrightMaterial : segmentloadedDimMaterial;

            const idleMesh = new three.Mesh(segmentGeometry, idleMaterial);
            const loadedMesh = new three.Mesh(segmentGeometry, loadedMaterial);

            idleMesh.rotation.set(0, (segmentDirections[i] * Math.PI) / 2, 0);
            loadedMesh.rotation.set(0, (segmentDirections[i] * Math.PI) / 2, 0);

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

        //
        const idleBoard = new three.Group().add(...segmentIdleMeshs);
        const loadedBoard = new three.Group().add(...segmentLoadedMeshs);

        return { loadedBoard, idleBoard };
    }, []);

    //
    useEffect(() => {
        //
        if (isTilt) {
            turnToTiltView(idleBoard);
            turnToTiltView(loadedBoard);
        } else {
            turnToFrontView(idleBoard);
            turnToFrontView(loadedBoard);
        }

        // Create vector3s
        const vector3s = [new three.Vector3(-0.5, 0.5, 0).applyMatrix4(idleBoard.children[0].matrix)];

        for (let i = 0; i < loadedBoard.children.length; i++)
            vector3s.push(new three.Vector3(0.5, 0.5, 0).applyMatrix4(loadedBoard.children[i].matrix));
        for (let i = idleBoard.children.length - 1; i >= 0; i--)
            vector3s.push(new three.Vector3(0.5, -0.5, 0).applyMatrix4(idleBoard.children[i].matrix));

        vector3s.push(new three.Vector3(-0.5, -0.5, 0).applyMatrix4(loadedBoard.children[0].matrix));
        vector3s.push(vector3s[0].clone());

        setVector3s(vector3s);

        // Create position
        const sphere = new three.Sphere().setFromPoints(vector3s);
        const position = new three.Vector3().sub(sphere.center).toArray();

        setPosition(position);
    }, [isTilt, idleBoard, loadedBoard]);

    useEffect(() => setPercentage(percentage, idleBoard, loadedBoard), [percentage, idleBoard, loadedBoard]);

    if (!vector3s) return <></>;

    //
    return (
        <group position={position}>
            <primitive object={idleBoard} />
            <primitive object={loadedBoard} />
            <Line points={vector3s} color={0x000000} linewidth={2} />
        </group>
    );
}

function turnToTiltView(group: three.Group) {
    const meshs = group.children;

    meshs.forEach((m, i) => {
        m.scale.set(m.userData.tiltViewScaleX, 1, 1);
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

function turnToFrontView(group: three.Group) {
    const meshs = group.children;

    meshs.forEach((m, i) => {
        m.scale.set(m.userData.frontViewScaleX, 1, 1);
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

function setPercentage(percentage: number, idleGroup: three.Group, loadedGroup: three.Group) {
    //
    const idleMeshs = idleGroup.children as three.Mesh[];
    const loadedMeshs = loadedGroup.children as three.Mesh[];

    const segmentLengths = idleMeshs.map(mesh => {
        const geometry = mesh.geometry as three.PlaneGeometry;
        const width = geometry.parameters.width;
        const scale = mesh.userData.tiltViewScaleX as number;

        return width * scale;
    });
    const totalLength = segmentLengths.reduce((prev, next) => prev + next, 0);
    const loadedLength = (totalLength * percentage) / 100;

    //
    let cumulativeLength = 0;
    let targetIndex = -1;

    for (let i = 0; i < segmentLengths.length; i++) {
        cumulativeLength += segmentLengths[i];

        if (cumulativeLength < loadedLength) continue;

        targetIndex = i;
        break;
    }

    if (targetIndex === -1) throw new Error('Can not find "targetIndex"');

    // reset
    for (let i = 0; i < segmentLengths.length; i++) {
        const idleMesh = idleMeshs[i];
        const loadedMesh = loadedMeshs[i];

        idleMesh.userData.offsetX && idleMesh.translateX(-idleMesh.userData.offsetX);
        loadedMesh.userData.offsetX && loadedMesh.translateX(-loadedMesh.userData.offsetX);

        delete idleMesh.userData.offsetX;
        delete loadedMesh.userData.offsetX;
    }

    // transform
    const idleScale = (cumulativeLength - loadedLength) / segmentLengths[targetIndex];
    const loadedScale = 1 - idleScale;

    for (let i = 0; i < targetIndex; i++) {
        idleMeshs[i].scale.set(0, 1, 1);
        loadedMeshs[i].scale.set(loadedMeshs[i].userData.tiltViewScaleX, 1, 1);
    }

    for (let i = targetIndex + 1; i < segmentLengths.length; i++) {
        idleMeshs[i].scale.set(idleMeshs[i].userData.tiltViewScaleX, 1, 1);
        loadedMeshs[i].scale.set(0, 1, 1);
    }

    idleMeshs[targetIndex].scale.set(idleMeshs[targetIndex].userData.tiltViewScaleX * idleScale, 1, 1);
    loadedMeshs[targetIndex].scale.set(loadedMeshs[targetIndex].userData.tiltViewScaleX * loadedScale, 1, 1);

    const idleOffsetX = ((1 - idleScale) * idleMeshs[targetIndex].userData.tiltViewScaleX) / 2;
    const loadedOffsetX = (-(1 - loadedScale) * loadedMeshs[targetIndex].userData.tiltViewScaleX) / 2;

    idleMeshs[targetIndex].translateX(idleOffsetX);
    loadedMeshs[targetIndex].translateX(loadedOffsetX);

    idleMeshs[targetIndex].userData.offsetX = idleOffsetX;
    loadedMeshs[targetIndex].userData.offsetX = loadedOffsetX;
}

export default Loading;
