import * as three from 'three';
import { useEffect, useMemo, useState } from 'react';
import { useControls, button } from 'leva';
import { Line, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function Loading() {
    const [isTilt, setIsTilt] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [percentage, setPercentage] = useState(0);

    useControls({
        Toggle: button(() => setIsTilt(prev => !prev)),
        Play: button(() => isRunning || setIsRunning(true)),
    });

    useFrame((...args) => {
        const [, delta] = args;

        if (!isRunning) return;
        if (percentage === 100) {
            setIsRunning(false);
            setTimeout(() => setPercentage(0), 1500);

            return;
        }

        const duration = 8; // unit: second

        setPercentage(prev => Math.min(prev + (delta / duration) * 100, 100));
    });

    const directions = useMemo(() => {
        const count = 13; // 段数（首段和末段必须是水平段）
        const directions: number[] = []; // 每段方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

        for (let i = 0; i < count; i++) {
            const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
            const sin = Math.sin(rad);

            directions.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
        }

        return directions;
    }, []);

    const [idle, loaded] = useMemo(() => {
        const idleGeometry = new three.BufferGeometry();
        const loadedGeometry = new three.BufferGeometry();

        const material = new three.MeshBasicMaterial({ side: three.DoubleSide, vertexColors: true });

        const idle = new three.Mesh(idleGeometry, material);
        const loaded = new three.Mesh(loadedGeometry, material);

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

        if (isTilt) {
            for (let i = 0; i < path.length; i += 2) linePositions.push(path[i], height / 2, path[i + 1]);
            for (let i = path.length - 1; i >= 0; i -= 2) linePositions.push(path[i - 1], -height / 2, path[i]);

            linePositions.push(path[0], height / 2, path[1]);

            return linePositions;
        }

        linePositions.push(path[0], height / 2, path[1]);
        linePositions.push(path.at(-2)!, height / 2, path.at(-1)!);
        linePositions.push(path.at(-2)!, -height / 2, path.at(-1)!);
        linePositions.push(path[0], -height / 2, path[1]);
        linePositions.push(path[0], height / 2, path[1]);

        return linePositions;
    }, [isTilt, path]);

    const {
        idlePositionAttribute,
        idleIndexAttribute,
        idleColorAttribute,
        loadedPositionAttribute,
        loadedIndexAttribute,
        loadedColorAttribute,
    } = useMemo(() => {
        // Find the target index
        const lengths = [];

        for (let i = 0; i < path.length - 2; i += 2) {
            const [prevX, prevZ] = [path[i], path[i + 1]];
            const [nextX, nextZ] = [path[i + 2], path[i + 3]];

            lengths.push(Math.hypot(nextX - prevX, nextZ - prevZ));
        }

        const totalLength = lengths.reduce((prev, next) => prev + next, 0);
        const percentLength = totalLength * (percentage / 100);

        let lengthIndex = 0;
        let cumulativeLength = 0;

        while (true) {
            cumulativeLength += lengths[lengthIndex];

            if (cumulativeLength >= percentLength) break;

            lengthIndex++;
        }

        // Calculate scale
        const idleScale = (cumulativeLength - percentLength) / lengths[lengthIndex];
        const loadedScale = 1 - idleScale;

        // Create position attribute
        const height = 1;

        const idlePositions = [];

        {
            const i = lengthIndex;
            const j = i + 1;
            const [x1, z1] = [path[i * 2 + 0], path[i * 2 + 1]];
            const [x2, z2] = [path[j * 2 + 0], path[j * 2 + 1]];
            const [x3, z3] = [(x1 - x2) * idleScale + x2, (z1 - z2) * idleScale + z2];

            idlePositions.push(x3, +height / 2, isTilt ? z3 : 0); // anticlockwise
            idlePositions.push(x3, -height / 2, isTilt ? z3 : 0);
            idlePositions.push(x2, -height / 2, isTilt ? z2 : 0);
            idlePositions.push(x2, +height / 2, isTilt ? z2 : 0);
        }

        for (let i = lengthIndex + 1; i < lengths.length; i++) {
            const j = i + 1;
            const [x1, z1] = [path[i * 2 + 0], path[i * 2 + 1]];
            const [x2, z2] = [path[j * 2 + 0], path[j * 2 + 1]];

            idlePositions.push(x1, +height / 2, isTilt ? z1 : 0); // anticlockwise
            idlePositions.push(x1, -height / 2, isTilt ? z1 : 0);
            idlePositions.push(x2, -height / 2, isTilt ? z2 : 0);
            idlePositions.push(x2, +height / 2, isTilt ? z2 : 0);
        }

        const idlePositionAttribute = new Float32Array(idlePositions);

        const loadedPositions = [];

        for (let i = 0; i < lengthIndex; i++) {
            const j = i + 1;
            const [x1, z1] = [path[i * 2 + 0], path[i * 2 + 1]];
            const [x2, z2] = [path[j * 2 + 0], path[j * 2 + 1]];

            loadedPositions.push(x1, +height / 2, isTilt ? z1 : 0); // anticlockwise
            loadedPositions.push(x1, -height / 2, isTilt ? z1 : 0);
            loadedPositions.push(x2, -height / 2, isTilt ? z2 : 0);
            loadedPositions.push(x2, +height / 2, isTilt ? z2 : 0);
        }

        {
            const i = lengthIndex;
            const j = i + 1;
            const [x1, z1] = [path[i * 2 + 0], path[i * 2 + 1]];
            const [x2, z2] = [path[j * 2 + 0], path[j * 2 + 1]];
            const [x3, z3] = [(x2 - x1) * loadedScale + x1, (z2 - z1) * loadedScale + z1];

            loadedPositions.push(x1, +height / 2, isTilt ? z1 : 0); // anticlockwise
            loadedPositions.push(x1, -height / 2, isTilt ? z1 : 0);
            loadedPositions.push(x3, -height / 2, isTilt ? z3 : 0);
            loadedPositions.push(x3, +height / 2, isTilt ? z3 : 0);
        }

        const loadedPositionAttribute = new Float32Array(loadedPositions);

        // Create index attribute
        const idleIndexes = [];

        for (let i = 0; i < idlePositions.length / 3; i += 4) {
            const [a, b, c, d] = [i + 0, i + 1, i + 2, i + 3];

            idleIndexes.push(a, b, d);
            idleIndexes.push(d, b, c);
        }

        const idleIndexAttribute = new Uint16Array(idleIndexes);

        const loadedIndexes = [];

        for (let i = 0; i < loadedPositions.length / 3; i += 4) {
            const [a, b, c, d] = [i + 0, i + 1, i + 2, i + 3];

            loadedIndexes.push(a, b, d);
            loadedIndexes.push(d, b, c);
        }

        const loadedIndexAttribute = new Uint16Array(loadedIndexes);

        // Create color attribute
        const idleDimColor = new three.Color(0xc6c6c6);
        const idleBrightColor = new three.Color(0xffffff);

        const idleColors = [];

        for (let i = 0; i < idlePositions.length / 3 / 4; i++) {
            const color = i % 2 === 0 ? idleBrightColor : idleDimColor;
            const array = color.toArray();

            idleColors.push(...array, ...array, ...array, ...array);
        }

        const idleColorAttribute = new Float32Array(idleColors.reverse());

        const loadedDimColor = new three.Color(0x1956a9);
        const loadedBrightColor = new three.Color(0x1873e1);

        const loadedColors = [];

        for (let i = 0; i < loadedPositions.length / 3 / 4; i++) {
            const color = i % 2 === 0 ? loadedBrightColor : loadedDimColor;
            const array = color.toArray();

            loadedColors.push(...array, ...array, ...array, ...array);
        }

        const loadedColorAttribute = new Float32Array(loadedColors);

        //
        return {
            idlePositionAttribute,
            idleIndexAttribute,
            idleColorAttribute,
            loadedPositionAttribute,
            loadedIndexAttribute,
            loadedColorAttribute,
        };
    }, [path, isTilt, percentage]);

    const position = useMemo(() => {
        const vector3s = [];

        for (let i = 0; i < path.length; i += 2) vector3s.push(new three.Vector3(path[i], 0, path[i + 1]));

        const box3 = new three.Box3().setFromPoints(vector3s);
        const center = box3.getCenter(new three.Vector3());

        return new three.Vector3().sub(center);
    }, [path]);

    useEffect(() => {
        idle.geometry.setIndex(new three.BufferAttribute(idleIndexAttribute, 1));
        idle.geometry.setAttribute('position', new three.BufferAttribute(idlePositionAttribute, 3));
        idle.geometry.setAttribute('color', new three.BufferAttribute(idleColorAttribute, 3));
        idle.geometry.computeBoundingSphere();
        idle.geometry.computeBoundingBox();

        loaded.geometry.setIndex(new three.BufferAttribute(loadedIndexAttribute, 1));
        loaded.geometry.setAttribute('position', new three.BufferAttribute(loadedPositionAttribute, 3));
        loaded.geometry.setAttribute('color', new three.BufferAttribute(loadedColorAttribute, 3));
        loaded.geometry.computeBoundingSphere();
        loaded.geometry.computeBoundingBox();
    }, [
        idlePositionAttribute,
        idleIndexAttribute,
        idleColorAttribute,
        loadedPositionAttribute,
        loadedIndexAttribute,
        loadedColorAttribute,
    ]);

    return (
        <group position={position}>
            <primitive object={idle} />
            <primitive object={loaded} />
            <Line points={linePositions} color={0x000000} linewidth={2} />
            <Text position={new three.Vector3(0, 0.8, 0)} color="black" fontSize={0.5} anchorX="left" anchorY="middle">
                Progress: {percentage.toFixed() + '%'}
            </Text>
        </group>
    );
}

export default Loading;
