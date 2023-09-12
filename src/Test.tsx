import * as three from 'three';
import { useEffect, useMemo, useState } from 'react';
import { useControls } from 'leva';
import { Line } from '@react-three/drei';

function Loading() {
    const { isTilt, percentage } = useControls({ isTilt: true, percentage: { value: 78, min: 0, max: 100, step: 1 } });

    const [idleSegments, loadedSegments] = useMemo(() => {
        //
        const count = 13; // 段数
        const directions: number[] = []; // 每段方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

        for (let i = 0; i < count; i++) {
            const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
            const sin = Math.sin(rad);

            directions.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
        }

        //
        const geometry = new three.PlaneGeometry(1, 1);

        const idleDimMaterial = new three.MeshBasicMaterial({ color: 0xc6c6c6, side: three.DoubleSide });
        const idleBrightMaterial = new three.MeshBasicMaterial({ color: 0xffffff, side: three.DoubleSide });

        const loadedDimMaterial = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });
        const loadedBrightMaterial = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });

        const idleSegments = [];
        const loadedSegments = [];

        for (let i = 0; i < count; i++) {
            const idleMaterial = i % 2 === 0 ? idleBrightMaterial : idleDimMaterial;
            const loadedMaterial = i % 2 === 0 ? loadedBrightMaterial : loadedDimMaterial;

            const idleSegment = new three.Mesh(geometry, idleMaterial);
            const loadedSegment = new three.Mesh(geometry, loadedMaterial);

            idleSegment.rotation.set(0, (directions[i] * Math.PI) / 2, 0);
            loadedSegment.rotation.set(0, (directions[i] * Math.PI) / 2, 0);

            if (directions[i] === 0) {
                const extra = i === 0 ? 1 : 0;
                const random = Math.random() * 5 + 1 + extra;

                idleSegment.userData = { tiltViewLength: random, frontViewLength: random, percentage: 1 };
                loadedSegment.userData = { tiltViewLength: random, frontViewLength: random, percentage: 1 };
            } else {
                const random = Math.random() * 5 + 1;

                idleSegment.userData = { tiltViewLength: random, frontViewLength: 0, percentage: 1 };
                loadedSegment.userData = { tiltViewLength: random, frontViewLength: 0, percentage: 1 };
            }

            idleSegments.push(idleSegment);
            loadedSegments.push(loadedSegment);
        }

        return [idleSegments, loadedSegments];
    }, []);

    useMemo(() => {}, [isTilt, idleSegments, loadedSegments]);
}

function setView(viewType: 'tilt' | 'front', idleSegments: three.Mesh[], loadedSegments: three.Mesh[]) {
    [idleSegments, loadedSegments].forEach((segments, segmentsIndex) => {
        //
        segments.forEach((segment, segmentIndex) => {
            const name = viewType === 'tilt' ? 'tiltViewLength' : 'frontViewLength';
            const scale = segment.userData[name];

            segment.scale.setX(scale);
            segment.updateMatrix(); // 后续的某些计算需要依赖它的变换矩阵

            if (segmentIndex === 0) return;

            const prevSegment = segments[segmentIndex - 1];
            const nextSegment = segment;

            const prevVector3 = new three.Vector3(0.5, 0.5, 0).applyMatrix4(prevSegment.matrix);
            const nextVector3 = new three.Vector3(-0.5, 0.5, 0).applyMatrix4(nextSegment.matrix);

            nextSegment.position.add(prevVector3.sub(nextVector3));
            nextSegment.updateMatrix();
        });

        //
        const prefix = segmentsIndex === 0 ? 1 : -1;

        segments.forEach(segment => {
            const offset = ((segment.scale.x * (1 - segment.userData.percentage)) / 2) * prefix;

            segment.scale.setX(segment.scale.x * segment.userData.percentage);
            segment.translateX(offset);
        });
    });
}

function setProgress(percentage: number, idleSegments: three.Mesh[], loadedSegments: three.Mesh[]) {
    //
    const lengths = idleSegments.map(item => item.userData.tiltViewLength); // 此处假设PlaneGeometry的width为1
    const totalLength = lengths.reduce((prev, next) => prev + next, 0);
    const percentLength = totalLength * percentage;

    let index = 0;
    let cumulativeLength = 0;

    while (true) {
        cumulativeLength += lengths[index];

        if (cumulativeLength > percentLength) break;

        index++;
    }

    if (index === -1) throw new Error('Can not find right index');

    // reset?

    //
    const idlePercentage = (cumulativeLength - percentLength) / lengths[index];
    const loadedPercentage = 1 - idlePercentage;

    for (let i = 0; i < lengths.length; i++) {
        const idleUserData = idleSegments[i].userData;
        const loadedUserData = loadedSegments[i].userData;

        if (i === index) {
            idleUserData.percentage = idlePercentage;
            loadedUserData.percentage = loadedPercentage;

            continue;
        }

        if (i < index) {
            idleUserData.percentage = 0;
            loadedUserData.percentage = 1;

            continue;
        }

        if (i > index) {
            idleUserData.percentage = 1;
            loadedUserData.percentage = 0;

            continue;
        }
    }
}

function update() {}
