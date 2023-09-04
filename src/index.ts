import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function Box(props) {
  const meshRef = useRef<Mesh>(null!)

  useEffect(() => {
    console.log(Boolean(meshRef.current))
  }, [])

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}

createRoot(document.getElementById('root')!).render(
  <Canvas>
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <Box position={[-1.2, 0, 0]} />
    <Box position={[1.2, 0, 0]} />
  </Canvas>,
)