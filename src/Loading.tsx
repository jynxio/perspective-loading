import * as three from 'three';
import { Line } from '@react-three/drei';

function Loading() {
    const segmentCount = 13; // loading的段数
    const segmentDirections = []; // 每一段的方向: 0 -> 0°, 1 -> 90°, -1 -> -90°

    const segmentGeometry = new three.PlaneGeometry(1, 1);
    const segmentIdleDimMaterial = new three.MeshBasicMaterial({ color: 0xc6c6c6, side: three.DoubleSide });
    const segmentIdleBrightMaterial = new three.MeshBasicMaterial({ color: 0xffffff, side: three.DoubleSide });
    const segmentloadedDimMaterial = new three.MeshBasicMaterial({ color: 0x1956a9, side: three.DoubleSide });
    const segmentLoadedBrightMaterial = new three.MeshBasicMaterial({ color: 0x1873e1, side: three.DoubleSide });

    for (let i = 0; i < segmentCount; i++) {
        const rad = ((i * Math.PI) / 2) % (Math.PI * 2);
        const sin = Math.sin(rad);

        segmentDirections.push(Math.abs(sin) < Number.EPSILON ? 0 : sin);
    }

    return (
        <group>
            {segmentDirections.map((d, i) => {
                const material = i % 2 === 0 ? segmentIdleBrightMaterial : segmentIdleDimMaterial;

                return <mesh></mesh>;
            })}
        </group>
    );
}

export default Loading;
