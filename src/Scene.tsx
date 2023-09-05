import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import Loading from './Loading';

function Scene() {
    return (
        <Canvas>
            <CameraControls />
            <color attach="background" args={[0xe2e0e2]} />
            <Loading />
        </Canvas>
    );
}

export default Scene;
