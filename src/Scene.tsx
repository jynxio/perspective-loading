import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import Loading from './Loading';

function Scene() {
    return (
        <Canvas camera={{ position: [0, 0, 30], fov: 45, near: 0.01, far: 1000 }}>
            <CameraControls />
            <color attach="background" args={[0xe2e0e2]} />
            <Loading />
        </Canvas>
    );
}

export default Scene;
