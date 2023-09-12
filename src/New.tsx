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
        return;
    }, [path, isTilt, percentage]);

    const [loadedPositionAttribute, loadedIndexAttribute, loadedColorAttribute] = useMemo(() => {
        return;
    }, [path, isTilt, percentage]);

    return (
        <group>
            <primitive object={idle} />
            <primitive object={loaded} />
            <Line points={linePositions} color={0x000000} linewidth={2} />
        </group>
    );
}

export default Loading;
