import * as three from 'three';
import { useLayoutEffect, useMemo, useState } from 'react';
import { useControls } from 'leva';
import { Line } from '@react-three/drei';

function Loading() {
    const { isTilt, percentage } = useControls({ isTilt: true, percentage: { value: 78, min: 0, max: 100, step: 1 } });

    const directions = useMemo(() => {
        const count = 13; // 段数
        const directions: number[] = []; // 每段方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

        for (let i = 0; i < count; i++) {
            const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
            const sin = Math.sin(rad);

            directions.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
        }

        return directions;
    }, []);

    const [idle, loaded] = useMemo(() => {
        const geometry = new three.BufferGeometry();
        const material = new three.MeshBasicMaterial({ side: three.DoubleSide });
        const idle = new three.Mesh(geometry, material);
        const loaded = idle.clone(true);

        return [idle, loaded];
    }, []);

    const path = useMemo(() => {
        const path = [0, 0]; // 2d路径

        for (let i = 0, cumulative = 0; i < directions.length; i++) {
            const direction = directions[i];
            const length = direction === 0 ? Math.random() * 2 + 2 : Math.random() * 8 + 2;
            const [prevX, prevZ] = path.slice(-2);

            if (i === directions.length - 2) {
                path.push(prevX, prevZ - cumulative);
            } else if (direction === 0) {
                path.push(prevX + length, prevZ);
            } else if (direction === 1) {
                path.push(prevX, prevZ - length);
                cumulative -= length;
            } else if (direction === -1) {
                path.push(prevX, prevZ + length);
                cumulative += length;
            }
        }

        return path;
    }, [directions]);

    const linePositions = useMemo(() => {
        const height = 1;
        const linePositions = [];

        for (let i = 0; i < path.length; i += 2) linePositions.push(path[i], height / 2, path[i + 1]);
        for (let i = path.length - 1; i >= 0; i -= 2) linePositions.push(path[i - 1], -height / 2, path[i]);

        linePositions.push(path[0], height / 2, path[1]);

        return linePositions;
    }, [path]);

    const [idlePositionAttribute, idleIndexAttribute, idleColorAttribute] = useMemo(() => {
        // Find the target index
        const lengths = [];

        for (let i = 2; i < path.length; i += 2) {
            const [prevX, prevZ] = [path[i - 2], path[i - 1]];
            const [nextX, nextZ] = [path[i], path[i + 1]];

            lengths.push(Math.hypot(nextX - prevX, nextZ - prevZ));
        }

        const totalLength = lengths.reduce((prev, next) => prev + next, 0);
        const percentLength = (totalLength * percentage) / 100;

        let lengthIndex = 0;
        let cumulativeLength = 0;

        while (true) {
            cumulativeLength += lengths[lengthIndex];

            if (cumulativeLength > percentLength) break;

            lengthIndex++;
        }

        // Calculate scale
        const scale = 1 - (cumulativeLength - percentLength) / lengths[lengthIndex];

        // Create position
        const height = 1;
        const positions = [];

        for (let i = 0; i < lengthIndex; i++) {
            const j = i + 1;
            const [x1, z1] = [path[i * 2 + 0], path[i * 2 + 1]];
            const [x2, z2] = [path[j * 2 + 0], path[j * 2 + 1]];

            positions.push(x1, +height / 2, z1); // anticlockwise
            positions.push(x1, -height / 2, z1);
            positions.push(x2, -height / 2, z2);
            positions.push(x2, +height / 2, z2);
        }

        {
            const i = lengthIndex;
            const j = i + 1;
            const [x1, z1] = [path[i * 2 + 0], path[i * 2 + 1]];
            const [x2, z2] = [path[j * 2 + 0], path[j * 2 + 1]];
            const [x3, z3] = [(x1 + x2) * scale, (z1 + z2) * scale];

            positions.push(x1, +height / 2, z1); // anticlockwise
            positions.push(x1, -height / 2, z1);
            positions.push(x3, -height / 2, z3);
            positions.push(x3, +height / 2, z3);
        }

        const positionAttribute = new Float32Array(positions);

        // Create indexes

        return [positionAttribute];
    }, [path, isTilt, percentage]);

    const [loadedPositionAttribute, loadedIndexAttribute, loadedColorAttribute] = useMemo(() => {
        return [];
    }, [path, isTilt, percentage]);

    return (
        <group>
            <primitive object={idle} />
            <primitive object={loaded} />
            <mesh>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={idlePositionAttribute.length / 3}
                        array={idlePositionAttribute}
                        itemSize={3}
                    />
                </bufferGeometry>
                <meshBasicMaterial color={0xff0000} side={three.DoubleSide} />
            </mesh>
            <Line points={linePositions} color={0x000000} linewidth={2} />
        </group>
    );
}

export default Loading;
