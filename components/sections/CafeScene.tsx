'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { QuadraticBezierLine, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

type Progress = MutableRefObject<number>;

const C = {
  espresso: '#291C15',
  brown: '#433528',
  wood: '#5a4030',
  gold: '#D5A51E',
  ivory: '#F7F4EF',
  stone: '#E5DED1',
  taupe: '#8A7D6C',
  night: '#140c08',
};

/* ---------- helpers ---------- */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (x: number) => x * x * (3 - 2 * x);

// Progress inside step k (0 to 6): a and b are fractions of that step's scroll range.
const sw = (p: number, k: number, a: number, b: number) => ease(win(p * 7 - k, a, b));

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------- the camera path ---------- */
// One continuous spline through every step. No cuts, the camera simply keeps moving.

const STATIONS = [
  { pos: [0, 1.75, 16.5], look: [0, 2.4, 6] }, // 1 Join: on the street, facing the door
  { pos: [0, 1.6, 1.0], look: [0, 1.25, -4.2] }, // 2 Enter: just inside, the round table ahead
  { pos: [1.1, 2.1, 0.4], look: [-0.2, 1.35, -4.2] }, // 3 Relationships: close enough to feel the conversation
  { pos: [0, 4.8, 1.8], look: [0, 1.3, -4.2] }, // 4 Visibility: lifted up to see the whole room
  { pos: [-1.6, 2.7, 1.2], look: [0.2, 1.5, -4.2] }, // 5 Referrals: across the table
  { pos: [0.6, 3.5, -2.2], look: [0, 1.4, -4] }, // 6 Collaborate: over the table, watching it come together
  { pos: [0, 24, 0], look: [0, 8, -42] }, // 7 Opportunities: up through the skylight, over the city
] as const;

const posCurve = new THREE.CatmullRomCurve3(
  STATIONS.map((s) => new THREE.Vector3(...s.pos)),
  false,
  'catmullrom',
  0.5
);
const lookCurve = new THREE.CatmullRomCurve3(
  STATIONS.map((s) => new THREE.Vector3(...s.look)),
  false,
  'catmullrom',
  0.5
);
// Portrait phones see a much narrower slice of the room, so inside the cafe the camera stands further back
const portraitPoints = STATIONS.map((s, i) => {
  const pos = new THREE.Vector3(...s.pos);
  if (i === 0) return new THREE.Vector3(pos.x, pos.y, pos.z + 3);
  if (i > 5) return pos;
  const look = new THREE.Vector3(...s.look);
  const p = look.clone().add(pos.sub(look).multiplyScalar(1.4));
  p.y = Math.min(p.y, 5.3);
  p.z = Math.min(p.z, 4.8);
  p.x = THREE.MathUtils.clamp(p.x, -7, 7);
  return p;
});
const posCurvePortrait = new THREE.CatmullRomCurve3(portraitPoints, false, 'catmullrom', 0.5);

// The camera rests at each station for most of a step, then glides to the next one
function stationU(p: number) {
  const x = Math.min(6, Math.max(0, p * 7 - 0.5));
  const k = Math.min(5, Math.floor(x));
  const f = x - k;
  return (k + THREE.MathUtils.smootherstep(f, 0.3, 0.7)) / 6;
}

function Rig({ progress, view }: { progress: Progress; view: Progress }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    camera.fov = size.width / size.height < 0.8 ? 68 : 50;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useEffect(() => {
    const portrait = size.width / size.height < 0.8;
    camera.fov = portrait ? 78 : 50;
    // Lifts the scene up the screen so the text panel at the bottom doesn't cover the action
    if (portrait) camera.setViewOffset(size.width, size.height, 0, size.height * 0.1, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((state, dt) => {
    view.current = THREE.MathUtils.damp(view.current, progress.current, 5, Math.min(dt, 0.1));
    const u = stationU(view.current);
    (camera.aspect < 0.8 ? posCurvePortrait : posCurve).getPoint(u, pos);
    lookCurve.getPoint(u, look);
    const t = state.clock.elapsedTime;
    pos.x += Math.sin(t * 0.6) * 0.03;
    pos.y += Math.sin(t * 0.8) * 0.02;
    camera.position.copy(pos);
    camera.lookAt(look);
  }, -1);

  return null;
}

/* ---------- atmosphere and light ---------- */

function Atmosphere({ p }: { p: Progress }) {
  const scene = useThree((s) => s.scene);
  const night = useMemo(() => new THREE.Color(C.night), []);
  const dawn = useMemo(() => new THREE.Color('#3b2412'), []);

  useEffect(() => {
    scene.background = new THREE.Color(C.night);
    scene.fog = new THREE.Fog(C.night, 16, 120);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const k = sw(p.current, 6, 0.1, 0.9);
    const bg = scene.background as THREE.Color | null;
    if (bg) bg.copy(night).lerp(dawn, k);
    if (scene.fog) {
      scene.fog.color.copy(night).lerp(dawn, k);
      (scene.fog as THREE.Fog).far = 120 + k * 40;
    }
  });
  return null;
}

function Lights({ p }: { p: Progress }) {
  const center = useRef<THREE.PointLight>(null);
  const door = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const v = p.current;
    if (center.current) {
      // Warmth builds as you step inside and again as the group builds something together
      center.current.intensity = 6 + 34 * sw(v, 0, 0.6, 1) + 26 * sw(v, 5, 0.1, 0.7);
    }
    if (door.current) door.current.intensity = 26 * sw(v, 0, 0.5, 0.95) * (1 - sw(v, 1, 0.3, 0.9));
  });

  return (
    <>
      <ambientLight intensity={0.8} color="#b6916f" />
      <hemisphereLight args={['#ffd9a8', '#2a1a10', 0.5]} />
      <pointLight ref={center} position={[0, 4.4, -4]} color="#ffc880" distance={26} decay={1.6} />
      <pointLight ref={door} position={[0, 2.4, 7.6]} color="#ffb15c" distance={16} decay={1.6} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return <pointLight key={i} position={[Math.sin(a) * 4.2, 3.6, -4 + Math.cos(a) * 4.2]} color="#ffbf70" intensity={14} distance={12} decay={1.6} />;
      })}
      <pointLight position={[-4.6, 4.2, 9.3]} color="#ffcf8a" intensity={32} distance={20} decay={1.6} />
      <pointLight position={[5.6, 4.2, 9.8]} color="#ffcf8a" intensity={32} distance={20} decay={1.6} />
    </>
  );
}

/* ---------- the street and the front of the cafe (step 1) ---------- */

function StreetLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 4.2, 8]} />
        <meshStandardMaterial color="#1a120d" roughness={0.8} />
      </mesh>
      <mesh position={[0.35, 4.15, 0]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffc36a" emissiveIntensity={2.4} />
      </mesh>
    </group>
  );
}

function Facade({ p }: { p: Progress }) {
  const door = useRef<THREE.Group>(null);
  const card = useRef<THREE.Group>(null);
  const reader = useRef<THREE.MeshStandardMaterial>(null);
  const logo = useTexture('/images/bpg-logo.png');
  logo.colorSpace = THREE.SRGBColorSpace;

  useFrame(({ clock }) => {
    const v = p.current;
    const t = clock.elapsedTime;

    // Membership card floats in, taps the reader, and the door opens
    const fly = ease(win(v * 7, 0.05, 0.45));
    if (card.current) {
      card.current.position.set(
        THREE.MathUtils.lerp(-0.2, 1.45, fly),
        THREE.MathUtils.lerp(1.6, 1.42, fly) + Math.sin(t * 1.4) * 0.04 * (1 - fly),
        THREE.MathUtils.lerp(9.2, 6.45, fly)
      );
      card.current.rotation.set(0, THREE.MathUtils.lerp(-0.35, 0, fly) + Math.sin(t * 0.8) * 0.08 * (1 - fly), 0);
      card.current.scale.setScalar(1 - ease(win(v * 7, 0.5, 0.62)));
    }
    if (reader.current) {
      const tap = win(v * 7, 0.42, 0.5) * (1 - win(v * 7, 0.5, 0.9));
      reader.current.emissiveIntensity = 0.5 + 2.6 * tap;
    }
    if (door.current) door.current.rotation.y = sw(v, 0, 0.5, 0.92) * 1.85;
  });

  const wall = { color: C.brown, roughness: 0.9, flatShading: true } as const;

  return (
    <group>
      {/* Wall either side of the door and above it */}
      <mesh position={[-5.05, 3, 6]}>
        <boxGeometry args={[7.9, 6, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[5.05, 3, 6]}>
        <boxGeometry args={[7.9, 6, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[0, 4.5, 6]}>
        <boxGeometry args={[2.2, 3, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>

      {/* Warm windows */}
      {[-4.2, 4.2].map((x) => (
        <group key={x} position={[x, 2.1, 6.17]}>
          <mesh>
            <planeGeometry args={[3.4, 2.2]} />
            <meshStandardMaterial color="#ffe2b0" emissive="#ffb55e" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.07, 2.2, 0.04]} />
            <meshStandardMaterial color={C.espresso} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[3.4, 0.07, 0.04]} />
            <meshStandardMaterial color={C.espresso} />
          </mesh>
        </group>
      ))}

      {/* The door, hinged on the left, swinging inward */}
      <group ref={door} position={[-1.1, 0, 6.05]}>
        <mesh position={[1.1, 1.5, 0]}>
          <boxGeometry args={[2.1, 3, 0.1]} />
          <meshStandardMaterial color={C.espresso} roughness={0.6} />
        </mesh>
        <mesh position={[1.1, 1.7, 0.06]}>
          <planeGeometry args={[1.5, 1.9]} />
          <meshStandardMaterial color="#ffe2b0" emissive="#ffb55e" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[1.85, 1.4, 0.1]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color={C.gold} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Sign above the door */}
      <mesh position={[0, 4.3, 6.2]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 4.3, 6.27]}>
        <boxGeometry args={[1.34, 1.34, 0.06]} />
        <meshStandardMaterial color={C.ivory} emissive={C.ivory} emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, 4.3, 6.31]}>
        <planeGeometry args={[0.66, 1.22]} />
        <meshBasicMaterial map={logo} transparent />
      </mesh>

      {/* Card reader beside the door */}
      <mesh position={[1.75, 1.4, 6.28]}>
        <boxGeometry args={[0.46, 0.7, 0.14]} />
        <meshStandardMaterial ref={reader} color={C.espresso} emissive={C.gold} emissiveIntensity={0.5} roughness={0.5} />
      </mesh>

      {/* The membership card */}
      <group ref={card} position={[-0.2, 1.6, 9.2]}>
        <mesh>
          <boxGeometry args={[1.0, 0.62, 0.03]} />
          <meshStandardMaterial color={C.ivory} emissive={C.ivory} emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, -0.2, 0.017]}>
          <planeGeometry args={[1.0, 0.12]} />
          <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[-0.28, 0.05, 0.018]}>
          <planeGeometry args={[0.22, 0.4]} />
          <meshBasicMaterial map={logo} transparent />
        </mesh>
      </group>
    </group>
  );
}

function Street() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -60]}>
        <planeGeometry args={[320, 220]} />
        <meshStandardMaterial color="#1a110c" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 28.2]}>
        <planeGeometry args={[160, 44]} />
        <meshStandardMaterial color="#1f1510" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.06, 7.3]}>
        <boxGeometry args={[18.6, 0.12, 2.4]} />
        <meshStandardMaterial color="#33251b" roughness={0.9} />
      </mesh>
      <StreetLamp x={-5} z={9.5} />
      <StreetLamp x={6} z={10} />
    </group>
  );
}

/* ---------- inside the cafe (step 2 onwards) ---------- */

const CENTER = new THREE.Vector3(0, 0, -4);
const SEAT_R = 2.9;

const seatAt = (i: number) => {
  const a = (i * Math.PI) / 3;
  return { a, x: Math.sin(a) * SEAT_R, z: CENTER.z + Math.cos(a) * SEAT_R };
};

function Ceiling() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-9, -6);
    shape.lineTo(9, -6);
    shape.lineTo(9, 14);
    shape.lineTo(-9, 14);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 4, 3.6, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = new THREE.ShapeGeometry(shape, 48);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} position={[0, 6, 0]}>
        <meshStandardMaterial color="#2c1f17" side={THREE.DoubleSide} roughness={1} />
      </mesh>
      {/* Gold trim around the skylight */}
      <mesh position={[0, 5.98, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.6, 0.07, 8, 96]} />
        <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.7} metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}

function SkylightGlass({ p }: { p: Progress }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const o = 0.9 * (1 - sw(p.current, 5, 0.55, 0.95));
    (ref.current.material as THREE.MeshBasicMaterial).opacity = o;
    ref.current.visible = o > 0.01;
  });
  return (
    <mesh ref={ref} position={[0, 6.4, -4]} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.6, 48]} />
      <meshBasicMaterial color="#27304d" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function Room() {
  const logo = useTexture('/images/bpg-logo.png');
  logo.colorSpace = THREE.SRGBColorSpace;
  const wall = { color: '#4b3628', roughness: 0.95, flatShading: true } as const;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color={C.wood} roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -4]}>
        <circleGeometry args={[4.1, 64]} />
        <meshStandardMaterial color="#3a2a1f" roughness={1} />
      </mesh>
      <mesh position={[0, 3, -14]}>
        <boxGeometry args={[18.3, 6, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[-9, 3, -4]}>
        <boxGeometry args={[0.3, 6, 20]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[9, 3, -4]}>
        <boxGeometry args={[0.3, 6, 20]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <Ceiling />

      {/* Sign on the back wall */}
      <mesh position={[0, 3.6, -13.8]}>
        <boxGeometry args={[1.5, 1.5, 0.08]} />
        <meshStandardMaterial color={C.ivory} emissive={C.ivory} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 3.6, -13.74]}>
        <planeGeometry args={[0.66, 1.22]} />
        <meshBasicMaterial map={logo} transparent />
      </mesh>

      {/* Counter and espresso machine */}
      <mesh position={[0, 0.55, -12.4]}>
        <boxGeometry args={[9, 1.1, 1.2]} />
        <meshStandardMaterial color={C.brown} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 1.12, -12.4]}>
        <boxGeometry args={[9.2, 0.08, 1.3]} />
        <meshStandardMaterial color={C.stone} roughness={0.6} />
      </mesh>
      <mesh position={[-1.6, 1.55, -12.4]}>
        <boxGeometry args={[1.4, 0.8, 0.7]} />
        <meshStandardMaterial color={C.gold} metalness={0.6} roughness={0.35} emissive={C.gold} emissiveIntensity={0.18} />
      </mesh>
      {[1.2, 2.2, 3.0].map((x) => (
        <mesh key={x} position={[x, 1.28, -12.4]}>
          <cylinderGeometry args={[0.14, 0.12, 0.28, 10]} />
          <meshStandardMaterial color={C.ivory} />
        </mesh>
      ))}

      {/* Smaller tables around the room for atmosphere */}
      {(
        [
          [-6.2, -9.2],
          [6.2, -9.2],
          [-6.6, -0.2],
          [6.6, -0.2],
        ] as const
      ).map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.07, 20]} />
            <meshStandardMaterial color={C.stone} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
            <meshStandardMaterial color={C.espresso} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.04, 16]} />
            <meshStandardMaterial color={C.espresso} />
          </mesh>
          {[0, 1].map((s) => (
            <mesh key={s} position={[s ? 0.95 : -0.95, 0.42, 0]}>
              <boxGeometry args={[0.45, 0.06, 0.45]} />
              <meshStandardMaterial color={C.brown} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Pendant lamps */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <group key={i} position={[Math.sin(a) * 4.2, 0, -4 + Math.cos(a) * 4.2]}>
            <mesh position={[0, 4.9, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 2.2, 6]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 3.7, 0]}>
              <coneGeometry args={[0.4, 0.34, 14, 1, true]} />
              <meshStandardMaterial color="#9a7420" metalness={0.5} roughness={0.45} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 3.62, 0]}>
              <sphereGeometry args={[0.13, 12, 10]} />
              <meshStandardMaterial color="#ffe6b8" emissive="#ffc36a" emissiveIntensity={3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Table() {
  return (
    <group position={[0, 0, -4]}>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.12, 64]} />
        <meshStandardMaterial color="#d9cdb8" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.062, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.035, 8, 80]} />
        <meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.35} emissive={C.gold} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 1.064, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.014, 6, 64]} />
        <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1.0, 16]} />
        <meshStandardMaterial color={C.espresso} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.95, 1.0, 0.06, 32]} />
        <meshStandardMaterial color={C.espresso} />
      </mesh>
    </group>
  );
}

function Cups() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 6 * 4;

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const cup = Math.floor(i / 4);
      const k = (t * 0.28 + (i % 4) * 0.25 + cup * 0.13) % 1;
      const s = seatAt(cup);
      const r = 1.65 / SEAT_R;
      dummy.position.set(s.x * r + Math.sin(k * 6 + cup) * 0.025, 1.2 + k * 0.5, CENTER.z + (s.z - CENTER.z) * r);
      dummy.scale.setScalar(Math.max(0.001, (0.04 + k * 0.07) * (1 - k * k)));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const s = seatAt(i);
        const r = 1.65 / SEAT_R;
        return (
          <group key={i} position={[s.x * r, 1.12, CENTER.z + (s.z - CENTER.z) * r]}>
            <mesh>
              <cylinderGeometry args={[0.085, 0.06, 0.1, 12]} />
              <meshStandardMaterial color={C.ivory} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.045, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.01, 12]} />
              <meshStandardMaterial color="#3a1f12" />
            </mesh>
            <mesh position={[0.095, 0, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.035, 0.01, 6, 10]} />
              <meshStandardMaterial color={C.ivory} />
            </mesh>
          </group>
        );
      })}
      <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#fff1d6" transparent opacity={0.28} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/* ---------- the entrepreneurs ---------- */

const PEOPLE = [
  { seat: 1, skin: '#e0b79a', shirt: '#F7F4EF', hair: '#2a1a10', icon: 'octa' },
  { seat: 2, skin: '#8d5a3b', shirt: '#D5A51E', hair: '#1a110c', icon: 'torus' },
  { seat: 3, skin: '#c68e6a', shirt: '#8A7D6C', hair: '#3a2415', icon: 'box' },
  { seat: 4, skin: '#f1c9a5', shirt: '#E5DED1', hair: '#5a3a22', icon: 'cone' },
  { seat: 5, skin: '#a9714f', shirt: '#6a5240', hair: '#120b07', icon: 'ico' },
] as const;

const yawFrom = (fromSeat: number, target: THREE.Vector3) => {
  const s = seatAt(fromSeat);
  const th = s.a + Math.PI;
  const vx = target.x - s.x;
  const vz = target.z - s.z;
  const lx = vx * Math.cos(th) - vz * Math.sin(th);
  const lz = vx * Math.sin(th) + vz * Math.cos(th);
  return THREE.MathUtils.clamp(Math.atan2(lx, lz), -1.1, 1.1);
};

function Chair({ color = C.brown }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.55, 0.07, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.88, -0.26]}>
        <boxGeometry args={[0.55, 0.7, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {[
        [-0.24, -0.24],
        [0.24, -0.24],
        [-0.24, 0.24],
        [0.24, 0.24],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.26, z]}>
          <boxGeometry args={[0.05, 0.52, 0.05]} />
          <meshStandardMaterial color={C.espresso} />
        </mesh>
      ))}
    </group>
  );
}

function BizIcon({ kind }: { kind: (typeof PEOPLE)[number]['icon'] }) {
  const mat = <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} roughness={0.35} flatShading />;
  switch (kind) {
    case 'octa':
      return <mesh><octahedronGeometry args={[0.15]} />{mat}</mesh>;
    case 'torus':
      return <mesh><torusGeometry args={[0.12, 0.045, 8, 16]} />{mat}</mesh>;
    case 'box':
      return <mesh><boxGeometry args={[0.2, 0.2, 0.2]} />{mat}</mesh>;
    case 'cone':
      return <mesh><coneGeometry args={[0.13, 0.26, 6]} />{mat}</mesh>;
    default:
      return <mesh><icosahedronGeometry args={[0.15]} />{mat}</mesh>;
  }
}

function Person({ idx, p, skin, shirt, hair, icon, seat }: { idx: number; p: Progress } & (typeof PEOPLE)[number]) {
  const s = seatAt(seat);
  const lean = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const iconRef = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);

  const yaws = useMemo(() => {
    const yourSeat = new THREE.Vector3(seatAt(0).x, 1.5, seatAt(0).z);
    const cam = new THREE.Vector3(0, 1.65, 1.6);
    const next = seatAt((seat + 1) % 6);
    const across = seatAt((seat + 2) % 6);
    return {
      cam: yawFrom(seat, cam),
      you: yawFrom(seat, yourSeat),
      next: yawFrom(seat, new THREE.Vector3(next.x, 1.5, next.z)),
      across: yawFrom(seat, new THREE.Vector3(across.x, 1.5, across.z)),
      center: yawFrom(seat, new THREE.Vector3(0, 1.2, -4)),
    };
  }, [seat]);

  useFrame(({ clock }) => {
    const v = p.current;
    const t = clock.elapsedTime;

    if (lean.current) {
      lean.current.scale.y = 1 + Math.sin(t * 1.4 + idx) * 0.012;
      lean.current.rotation.x = 0.16 * sw(v, 5, 0.1, 0.6) * (1 - sw(v, 6, 0.1, 0.5));
    }

    if (head.current) {
      const wCam = sw(v, 1, 0.2, 0.5) * (1 - sw(v, 2, 0.05, 0.3));
      const wNext = sw(v, 2, 0.2, 0.5) * (1 - sw(v, 3, 0.05, 0.3));
      const wYou = sw(v, 3, 0.2, 0.5) * (1 - sw(v, 4, 0.05, 0.3));
      const wAcross = sw(v, 4, 0.2, 0.5) * (1 - sw(v, 5, 0.05, 0.3));
      const wCenter = sw(v, 5, 0.1, 0.4);
      const target =
        wCam * yaws.cam + wNext * yaws.next + wYou * yaws.you + wAcross * yaws.across + wCenter * yaws.center;
      const idle = Math.sin(t * 0.5 + idx * 1.7) * 0.08;
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, target + idle, 4, 0.016);
    }

    if (iconRef.current) {
      const show = sw(v, 3, 0.15, 0.6) * (1 - 0.35 * sw(v, 4, 0, 0.4));
      iconRef.current.scale.setScalar(Math.max(0.001, show));
      iconRef.current.position.y = 2.5 + Math.sin(t * 1.3 + idx) * 0.06;
      iconRef.current.rotation.y = t * 0.8 + idx;
    }
    if (halo.current) {
      halo.current.rotation.x = Math.PI / 2 + Math.sin(t + idx) * 0.3;
      halo.current.rotation.y = t * 0.9;
    }
  });

  return (
    <group position={[s.x, 0, s.z]} rotation={[0, s.a + Math.PI, 0]}>
      <Chair />
      {/* Thighs and lower legs */}
      <mesh position={[0, 0.66, 0.18]}>
        <boxGeometry args={[0.42, 0.16, 0.5]} />
        <meshStandardMaterial color="#2a1c14" flatShading />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.32, 0.4]}>
          <boxGeometry args={[0.14, 0.62, 0.14]} />
          <meshStandardMaterial color="#2a1c14" flatShading />
        </mesh>
      ))}

      {/* Upper body leans from the hips */}
      <group ref={lean} position={[0, 0.72, 0]}>
        <mesh position={[0, 0.34, 0]}>
          <capsuleGeometry args={[0.2, 0.36, 4, 10]} />
          <meshStandardMaterial color={shirt} roughness={0.7} flatShading />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.27, 0.32, 0.18]} rotation={[1.15, 0, sd * 0.12]}>
            <capsuleGeometry args={[0.065, 0.34, 4, 8]} />
            <meshStandardMaterial color={shirt} roughness={0.7} flatShading />
          </mesh>
        ))}
        <mesh position={[0.1, 0.5, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 10]} />
          <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.6} />
        </mesh>

        <group ref={head} position={[0, 0.86, 0]}>
          <mesh>
            <sphereGeometry args={[0.17, 14, 12]} />
            <meshStandardMaterial color={skin} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 0.05, -0.025]} scale={[1.06, 0.95, 1.06]}>
            <sphereGeometry args={[0.175, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial color={hair} roughness={0.9} flatShading />
          </mesh>
        </group>
      </group>

      {/* A floating mark for each person's business, which grows in the visibility step */}
      <group ref={iconRef} position={[0, 2.5, 0]} rotation={[0, -(s.a + Math.PI), 0]}>
        <BizIcon kind={icon} />
        <mesh ref={halo}>
          <torusGeometry args={[0.3, 0.012, 6, 32]} />
          <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  );
}

function YourSeat({ p }: { p: Progress }) {
  const s = seatAt(0);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const k = 1 + Math.sin(clock.elapsedTime * 2) * 0.06;
    ring.current.scale.set(k, k, k);
    const m = ring.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.55 * sw(p.current, 1, 0.1, 0.5) * (1 - 0.6 * sw(p.current, 4, 0, 0.6));
  });
  return (
    <group position={[s.x, 0, s.z]} rotation={[0, s.a + Math.PI, 0]}>
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.07, 18]} />
        <meshStandardMaterial color="#6a5240" roughness={0.8} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI * 2) / 3) * 0.17, 0.26, Math.cos((i * Math.PI * 2) / 3) * 0.17]}>
          <cylinderGeometry args={[0.03, 0.03, 0.52, 6]} />
          <meshStandardMaterial color={C.espresso} />
        </mesh>
      ))}
      <mesh ref={ring} position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} />
        <meshBasicMaterial color={C.gold} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------- glowing lines ---------- */

type LineLike = { material: THREE.Material & { opacity: number; dashOffset: number }; visible: boolean };

function GlowLine({
  start,
  mid,
  end,
  gate,
  color = C.gold,
  width = 2.2,
  flow = 0.5,
  solid = false,
  worldUnits = false,
}: {
  start: [number, number, number];
  mid: [number, number, number];
  end: [number, number, number];
  gate: () => number;
  color?: string;
  width?: number;
  flow?: number;
  solid?: boolean;
  worldUnits?: boolean;
}) {
  const ref = useRef<LineLike | null>(null);
  useFrame((_, dt) => {
    const l = ref.current;
    if (!l) return;
    const o = gate();
    l.material.opacity = o;
    l.visible = o > 0.01;
    l.material.dashOffset -= dt * flow;
  });
  return (
    <QuadraticBezierLine
      ref={ref as never}
      start={start}
      mid={mid}
      end={end}
      color={color}
      lineWidth={width}
      worldUnits={worldUnits}
      dashed={!solid}
      dashScale={6}
      dashSize={0.5}
      gapSize={0.25}
      transparent
    />
  );
}

function Connections({ p }: { p: Progress }) {
  const pts = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5].map((i) => {
        const s = seatAt(i);
        const r = 0.88;
        return { x: s.x * r, z: CENTER.z + (s.z - CENTER.z) * r };
      }),
    []
  );
  return (
    <group>
      {pts.map((a, i) => {
        const b = pts[(i + 1) % 6];
        const mx = (a.x + b.x) / 2;
        const mz = (CENTER.z * 2 + a.z + b.z) / 4;
        return (
          <GlowLine
            key={i}
            start={[a.x, 1.5, a.z]}
            mid={[mx * 0.8, 2.0, mz]}
            end={[b.x, 1.5, b.z]}
            gate={() => 0.95 * sw(p.current, 2, 0.12 + i * 0.05, 0.5 + i * 0.05) * (1 - 0.55 * sw(p.current, 3, 0.3, 0.8))}
            color="#ffd27a"
            width={5}
          />
        );
      })}
    </group>
  );
}

/* ---------- step 4: visibility ---------- */

function Ripples({ p }: { p: Progress }) {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const s = seatAt(0);
  useFrame(({ clock }) => {
    const gate = sw(p.current, 3, 0.1, 0.4) * (1 - sw(p.current, 4, 0.1, 0.5));
    rings.current.forEach((m, i) => {
      if (!m) return;
      const k = (clock.elapsedTime * 0.35 + i / 3) % 1;
      m.scale.setScalar(1 + k * 7);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55 * gate;
      m.visible = gate > 0.01;
    });
  });
  return (
    <group position={[s.x, 0.04, s.z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => { rings.current[i] = m; }} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.0, 64]} />
          <meshBasicMaterial color={C.gold} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- step 5: referrals travel as coffee beans ---------- */

const BEAN_ROUTES: [number, number][] = [
  [1, 3], [2, 4], [3, 5], [4, 0], [5, 1], [0, 2], [1, 4], [2, 5], [3, 0],
];

function Beans({ p }: { p: Progress }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 18;
  const chest = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5].map((i) => {
        const s = seatAt(i);
        return new THREE.Vector3(s.x * 0.9, 1.55, CENTER.z + (s.z - CENTER.z) * 0.9);
      }),
    []
  );
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const gate = sw(p.current, 4, 0.1, 0.3) * (1 - sw(p.current, 5, 0.2, 0.5));
    for (let i = 0; i < N; i++) {
      const [a, b] = BEAN_ROUTES[i % BEAN_ROUTES.length];
      const A = chest[a];
      const B = chest[b];
      const k = (clock.elapsedTime * 0.32 + i / N) % 1;
      const u = 1 - k;
      tmp.set(
        u * u * A.x + 2 * u * k * ((A.x + B.x) / 2) * 0.55 + k * k * B.x,
        u * u * A.y + 2 * u * k * 2.6 + k * k * B.y,
        u * u * A.z + 2 * u * k * ((A.z + B.z) / 2 + CENTER.z * 0.45) * 0.7 + k * k * B.z
      );
      dummy.position.copy(tmp);
      dummy.rotation.set(k * 9, k * 7, 0);
      const s = gate * (0.9 + Math.sin(k * Math.PI) * 0.5);
      dummy.scale.set(0.08 * s, 0.052 * s, 0.052 * s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} roughness={0.35} />
    </instancedMesh>
  );
}

/* ---------- step 6: they build something together ---------- */

const BLOCK_SLOTS: [number, number, number][] = [
  [0.22, 1.18, 0],
  [-0.11, 1.18, 0.19],
  [-0.11, 1.18, -0.19],
  [0.1, 1.42, 0.07],
  [-0.1, 1.42, -0.07],
  [0, 1.66, 0],
];
const BLOCK_COLORS = [C.ivory, C.stone, C.taupe, '#6a5240', '#f0e4cc', C.gold];

function Blocks({ p }: { p: Progress }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const starts = useMemo(
    () =>
      [1, 2, 3, 4, 5, 0].map((seat) => {
        const s = seatAt(seat);
        const r = 0.6;
        return new THREE.Vector3(s.x * r, 1.14, CENTER.z + (s.z - CENTER.z) * r);
      }),
    []
  );

  useFrame(() => {
    refs.current.forEach((m, j) => {
      if (!m) return;
      const a = 0.08 + j * 0.1;
      const k = sw(p.current, 5, a, a + 0.38);
      const from = starts[j];
      const to = BLOCK_SLOTS[j];
      m.position.set(
        THREE.MathUtils.lerp(from.x, to[0], k),
        THREE.MathUtils.lerp(from.y, to[1], k) + Math.sin(k * Math.PI) * 0.55,
        THREE.MathUtils.lerp(from.z - CENTER.z, to[2], k) + CENTER.z
      );
      m.rotation.set(0, (1 - k) * 3, 0);
      m.scale.setScalar(Math.max(0.001, win(p.current * 7 - 5, a - 0.02, a + 0.05)));
    });
  });

  return (
    <group>
      {BLOCK_COLORS.map((c, j) => (
        <mesh key={j} ref={(m) => { refs.current[j] = m; }}>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshStandardMaterial
            color={c}
            roughness={0.45}
            emissive={j === 5 ? C.gold : '#000000'}
            emissiveIntensity={j === 5 ? 0.6 : 0}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- step 7: opportunities, out through the skylight and over the city ---------- */

function Beam({ p }: { p: Progress }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const g = sw(p.current, 5, 0.75, 1) * 0.4 * (1 - sw(p.current, 6, 0.3, 0.8) * 0.7);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = g * (0.85 + Math.sin(clock.elapsedTime * 3) * 0.15);
    ref.current.scale.x = ref.current.scale.z = 1 + sw(p.current, 6, 0, 0.5) * 0.9;
    ref.current.visible = g > 0.01;
  });
  return (
    <mesh ref={ref} position={[0, 10, -4]}>
      <cylinderGeometry args={[0.1, 0.16, 18, 16, 1, true]} />
      <meshBasicMaterial color="#ffd27a" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

type Building = { x: number; z: number; w: number; d: number; h: number; c: THREE.Color };

function City({ p, lite }: { p: Progress; lite: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const { buildings, nodes } = useMemo(() => {
    const r = rng(11);
    const list: Building[] = [];
    const count = lite ? 150 : 260;
    for (let i = 0; i < count * 2 && list.length < count; i++) {
      const x = (r() - 0.5) * 170;
      const z = 6 - r() * 135;
      const w = 3 + r() * 6;
      const d = 3 + r() * 6;
      const far = THREE.MathUtils.smoothstep(-z, 40, 115);
      const h = 3 + r() * 5 + far * r() * 34;
      if (Math.abs(x) - w / 2 < 9.8 && z + d / 2 > -15 && z - d / 2 < 6.6) continue;
      const tone = 0.7 + r() * 0.6;
      list.push({ x, z, w, d, h, c: new THREE.Color('#3a291e').multiplyScalar(tone) });
    }
    const cand = list.filter((b) => b.z < -18 && b.z > -105 && b.h > 7).sort((a, b) => b.z - a.z);
    const picks: [number, number, number][] = [];
    const want = 12;
    const step = Math.max(1, Math.floor(cand.length / want));
    for (let i = 0; i < cand.length && picks.length < want; i += step) picks.push([cand[i].x, cand[i].h + 0.6, cand[i].z]);
    return { buildings: list, nodes: picks };
  }, [lite]);

  const windows = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 256;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#000';
    g.fillRect(0, 0, 128, 256);
    const r = rng(5);
    for (let y = 8; y < 248; y += 20) {
      for (let x = 8; x < 120; x += 16) {
        if (r() > 0.5) {
          g.fillStyle = r() > 0.5 ? '#ffd9a0' : '#ffb35c';
          g.fillRect(x, y, 8, 11);
        }
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 2);
    return t;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const d = new THREE.Object3D();
    buildings.forEach((b, i) => {
      d.position.set(b.x, b.h / 2, b.z);
      d.scale.set(b.w, b.h, b.d);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      m.setColorAt(i, b.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [buildings]);

  const roof: [number, number, number] = [0, 6.3, -4];

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} emissive="#ffffff" emissiveMap={windows} emissiveIntensity={0.85} flatShading />
      </instancedMesh>

      {/* The network: light travels from the cafe out across the city */}
      {nodes.map((n, i) => {
        const from = i === 0 ? roof : nodes[i - 1];
        const to = n;
        const mid: [number, number, number] = [
          (from[0] + to[0]) / 2,
          Math.max(from[1], to[1]) + 10 + i,
          (from[2] + to[2]) / 2,
        ];
        const g = () => sw(p.current, 6, 0.28 + i * 0.045, 0.5 + i * 0.045);
        return (
          <group key={i}>
            <GlowLine start={[from[0], from[1], from[2]]} mid={mid} end={[to[0], to[1], to[2]]} gate={() => 0.95 * g()} width={0.7} flow={0.8} solid worldUnits />
            <NodeBeacon position={to} gate={g} />
          </group>
        );
      })}
      {nodes.length > 4 &&
        ([
          [1, 4],
          [3, 7],
          [2, 6],
          [5, 9],
        ] as const).map(([a, b], i) => {
          if (!nodes[a] || !nodes[b]) return null;
          const from = nodes[a];
          const to = nodes[b];
          const mid: [number, number, number] = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + 8, (from[2] + to[2]) / 2];
          return (
            <GlowLine
              key={`x${i}`}
              start={[from[0], from[1], from[2]]}
              mid={mid}
              end={[to[0], to[1], to[2]]}
              gate={() => 0.7 * sw(p.current, 6, 0.55 + i * 0.05, 0.9)}
              width={0.45}
              flow={0.6}
              solid
              worldUnits
            />
          );
        })}
    </group>
  );
}

function NodeBeacon({ position, gate }: { position: [number, number, number]; gate: () => number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const g = gate();
    ref.current.scale.setScalar(Math.max(0.001, g) * (1 + Math.sin(clock.elapsedTime * 2.5 + position[0]) * 0.12));
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[1.3, 12, 10]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <mesh position={[0, 11, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 22, 6]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Dawn({ p }: { p: Progress }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext('2d')!;
    const grad = g.createLinearGradient(0, 256, 0, 0);
    grad.addColorStop(0, 'rgba(255,196,110,1)');
    grad.addColorStop(0.35, 'rgba(255,150,60,0.45)');
    grad.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame(() => {
    if (!ref.current) return;
    const o = sw(p.current, 6, 0.1, 0.8) * 0.9;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = o;
    ref.current.visible = o > 0.01;
  });
  return (
    <mesh ref={ref} position={[0, 28, -190]}>
      <planeGeometry args={[520, 110]} />
      <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </mesh>
  );
}

/* ---------- the scene ---------- */

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

export type CafeSceneProps = {
  progress: Progress;
  active: boolean;
  lite: boolean;
  onReady?: () => void;
};

export default function CafeScene({ progress, active, lite, onReady }: CafeSceneProps) {
  const view = useRef(0);

  return (
    <Canvas
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 50, near: 0.1, far: 240, position: [0.4, 1.7, 11.5] }}
      gl={{ antialias: !lite, powerPreference: 'high-performance' }}
    >
      <Atmosphere p={view} />
      <Rig progress={progress} view={view} />
      <Lights p={view} />
      <Suspense fallback={null}>
        <Street />
        <Facade p={view} />
        <Room />
        <SkylightGlass p={view} />
        <Table />
        <Cups />
        <YourSeat p={view} />
        {PEOPLE.map((person, i) => (
          <Person key={person.seat} idx={i} p={view} {...person} />
        ))}
        <Connections p={view} />
        <Ripples p={view} />
        <Beans p={view} />
        <Blocks p={view} />
        <Beam p={view} />
        <City p={view} lite={lite} />
        <Dawn p={view} />
        {!lite && <Stars radius={110} depth={40} count={900} factor={3.2} fade speed={0.4} />}
        <Ready onReady={onReady ?? (() => {})} />
      </Suspense>
    </Canvas>
  );
}