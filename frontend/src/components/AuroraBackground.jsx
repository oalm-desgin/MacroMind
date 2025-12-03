import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Aurora-like flowing background with Purple/Pink/Deep Blue theme
const AuroraPlane = () => {
  const { scene } = useThree()
  const materialRef = useRef()

  useEffect(() => {
    const geometry = new THREE.PlaneGeometry(200, 200)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Create flowing aurora-like patterns
          float flow1 = snoise(vec2(uv.x * 2.0 + time * 0.1, uv.y * 0.5 + time * 0.05));
          float flow2 = snoise(vec2(uv.x * 1.5 + time * 0.08, uv.y * 0.8 + time * 0.03));
          float flow3 = snoise(vec2(uv.x * 3.0 + time * 0.12, uv.y * 0.3 + time * 0.07));
          
          // Create streaky patterns
          float streaks = sin((uv.x + flow1 * 0.3) * 8.0 + time * 0.2) * 0.5 + 0.5;
          streaks *= sin((uv.y + flow2 * 0.2) * 12.0 + time * 0.15) * 0.5 + 0.5;
          
          // Combine flows for aurora effect
          float aurora = (flow1 + flow2 + flow3) * 0.33 + 0.5;
          aurora = pow(aurora, 2.0);
          
          // Deep Purple, Midnight Blue, and Neon Pink/Cyan color theme
          vec3 deepPurple = vec3(0.15, 0.0, 0.35);
          vec3 midnightBlue = vec3(0.05, 0.05, 0.25);
          vec3 purple = vec3(0.5, 0.2, 0.6);
          vec3 neonPink = vec3(1.0, 0.2, 0.8);
          vec3 neonCyan = vec3(0.0, 0.9, 1.0);
          
          // Create flowing color transitions
          vec3 color = deepPurple;
          
          // Add midnight blue flows
          float midnightFlow = smoothstep(0.2, 0.6, aurora + streaks * 0.3);
          color = mix(color, midnightBlue, midnightFlow);
          
          // Add purple highlights
          float purpleFlow = smoothstep(0.5, 0.8, aurora + flow1 * 0.4);
          color = mix(color, purple, purpleFlow);
          
          // Add neon pink streaks
          float neonPinkFlow = smoothstep(0.75, 1.0, streaks + aurora * 0.5);
          color = mix(color, neonPink, neonPinkFlow * 0.6);
          
          // Add neon cyan accents
          float neonCyanFlow = smoothstep(0.65, 0.9, flow3 + streaks * 0.25);
          color = mix(color, neonCyan, neonCyanFlow * 0.4);
          
          // Add subtle noise texture
          float noise = snoise(uv * 100.0) * 0.02;
          color += noise;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    })

    materialRef.current = material
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = -50
    scene.add(mesh)

    const animate = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.time.value += 0.01
        requestAnimationFrame(animate)
      }
    }
    animate()

    return () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    }
  }, [scene])

  return null
}

// Camera Controller
const CameraController = () => {
  const { camera } = useThree()

  useFrame((state) => {
    const time = state.clock.elapsedTime
    camera.position.x = Math.sin(time * 0.05) * 3
    camera.position.y = Math.cos(time * 0.07) * 2
    camera.position.z = 30
    camera.lookAt(0, 0, -30)
  })

  return null
}

// Main Aurora Background Component
const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <AuroraPlane />
        <CameraController />
        
        {/* Subtle lighting to enhance the aurora effect */}
        <ambientLight intensity={0.9} />
        <pointLight 
          position={[20, 20, 10]} 
          intensity={0.8} 
          color="#7c3aed"
          distance={100}
          decay={2}
        />
        <pointLight 
          position={[-20, -10, 5]} 
          intensity={0.6} 
          color="#ff00ff"
          distance={80}
          decay={2}
        />
        <pointLight 
          position={[0, -20, 8]} 
          intensity={0.5} 
          color="#00ffff"
          distance={90}
          decay={2}
        />
      </Canvas>
    </div>
  )
}

export default AuroraBackground

