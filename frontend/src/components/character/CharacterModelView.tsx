'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import styles from './CharacterTurntable.module.scss';

// Bir tam tur süresi (sn), kendi kendine dönerken
const AUTO_TURN_SECONDS = 14;
// Sürüklerken bir piksel başına dönüş (radyan)
const DRAG_RAD_PER_PX = 0.012;
// Bırakıldıktan sonra kendi kendine dönmeye devam etmeden önce beklenen süre (ms)
const RESUME_DELAY = 1800;
// Bırakılan dönüşün saniyedeki sönümü (1'e yakın = uzun süzülme)
const SPIN_DAMPING = 0.04;
// Karakter boyu sahne biriminde; kamera buna göre kadrajlanır
const MODEL_HEIGHT = 1.8;
// Dar açılı (≈85 mm) kamera: perspektif bozulmadan derinlik verir
const CAMERA_FOV = 20;
// Kamera göğüs hizasının altından hafifçe yukarı bakar (kahraman açısı)
const CAMERA_HEIGHT = 0.75;
const LOOK_AT_HEIGHT = 0.88;
// Karenin üstünde ve altında bırakılan pay (boyun oranı)
const FRAME_MARGIN = 0.04;

type Props = {
  src: string;
  className?: string;
  alt: string;
  onError: () => void;
};

function setupLights(scene: THREE.Scene) {
  // Ortam: yukarıdan sıcak, aşağıdan koyu (mum ışıklı taş zemin)
  scene.add(new THREE.HemisphereLight(0xffe2c0, 0x1a0c08, 0.55));

  // Anahtar ışık sol üst önden, sıcak
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
  key.position.set(-1.6, 2.6, 2.4);
  scene.add(key);

  // Sağdan soğuk ve zayıf dolgu
  const fill = new THREE.DirectionalLight(0xc8d4ff, 0.5);
  fill.position.set(2.2, 1.2, 1.5);
  scene.add(fill);

  // Arkadan iki kenar ışığı: sol kızıl, sağ mum sarısı; koyu kıyafet koyu panelde siluetini korur
  const rimRed = new THREE.DirectionalLight(0xff3020, 2.2);
  rimRed.position.set(-2.2, 1.6, -2.2);
  scene.add(rimRed);
  const rimGold = new THREE.DirectionalLight(0xffc070, 1.8);
  rimGold.position.set(2.2, 2.0, -2.0);
  scene.add(rimGold);
}

// Menüdeki ve gardıroptaki gerçek zamanlı 3D karakter: durma animasyonuyla yavaşça döner,
// sürüklenince elle çevrilir, bırakınca süzülerek yavaşlar.
export default function CharacterModelView({ src, className = '', alt, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const spin = useRef({ yaw: 0, velocity: 0, resumeAt: 0 });
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let raf = 0;
    let visible = true;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      onErrorRef.current();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    // Metal parçalar ortam yansıması olmadan simsiyah görünür; hafif bir oda yansıması verilir
    scene.environment = envMap;
    scene.environmentIntensity = 0.35;
    setupLights(scene);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);
    const pivot = new THREE.Group();
    scene.add(pivot);

    const fitCamera = () => {
      const { clientWidth: w, clientHeight: h } = container;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Kamera mesafesi: karakter boyu (+pay) dikey görüş açısına sığsın
      const halfFov = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
      const span = MODEL_HEIGHT * (1 + FRAME_MARGIN * 2);
      const distance = span / 2 / Math.tan(halfFov);
      camera.position.set(0, CAMERA_HEIGHT, distance);
      camera.lookAt(0, LOOK_AT_HEIGHT, 0);
      camera.updateProjectionMatrix();
    };
    fitCamera();
    const resizeObserver = new ResizeObserver(fitCamera);
    resizeObserver.observe(container);

    // Ekran dışındayken çizme (menü kaydırıldığında GPU boşa çalışmasın)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(container);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mixer: THREE.AnimationMixer | null = null;
    const timer = new THREE.Timer();
    timer.connect(document);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      src,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const model = gltf.scene;
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        model.traverse((obj) => {
          if (!(obj as THREE.Mesh).isMesh) return;
          const mesh = obj as THREE.Mesh;
          // Döndükçe kemikler sınır kutusunun dışına çıkabilir; karakter kırpılmasın
          mesh.frustumCulled = false;
          for (const mat of materialsOf(mesh)) {
            for (const tex of texturesOf(mat)) tex.anisotropy = maxAnisotropy;
          }
        });

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
          mixer.update(0);
        }

        // Ayaklar y=0'da, gövde ortada, boy MODEL_HEIGHT olacak şekilde ölçekle
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model, true);
        const size = box.getSize(new THREE.Vector3());
        const scale = MODEL_HEIGHT / (size.y || 1);
        model.scale.multiplyScalar(scale);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        pivot.add(model);

        renderer.render(scene, camera);
        setReady(true);
      },
      undefined,
      (err) => {
        console.error('Karakter modeli yüklenemedi:', err);
        if (!disposed) onErrorRef.current();
      },
    );

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      timer.update(now);
      if (!visible) return;
      const dt = Math.min(timer.getDelta(), 0.1);
      const s = spin.current;
      if (!drag.current) {
        if (Math.abs(s.velocity) > 0.01) {
          // Bırakılan dönüş süzülerek yavaşlar
          s.yaw += s.velocity * dt;
          s.velocity *= Math.pow(SPIN_DAMPING, dt);
        } else if (!reduceMotion && now >= s.resumeAt) {
          s.yaw += (dt * Math.PI * 2) / AUTO_TURN_SECONDS;
        }
      }
      pivot.rotation.y = s.yaw;
      if (mixer && !reduceMotion) mixer.update(dt);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      timer.dispose();
      mixer?.stopAllAction();
      disposeObject(scene);
      envMap.dispose();
      renderer.dispose();
      // Gardıropta karakter değiştikçe yeni bağlam açılır; tarayıcının bağlam sınırına takılmasın
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [src]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, t: performance.now() };
    spin.current.velocity = 0;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const now = performance.now();
    const delta = (e.clientX - drag.current.x) * DRAG_RAD_PER_PX;
    const dt = Math.max((now - drag.current.t) / 1000, 1 / 240);
    // Sağa sürükleyince karakterin önü sağa döner
    spin.current.yaw += delta;
    spin.current.velocity = delta / dt;
    drag.current = { x: e.clientX, t: now };
  };

  const endDrag = () => {
    if (!drag.current) return;
    // Parmak kalktıktan sonra bir süre hareket etmediyse savurma yok
    if (performance.now() - drag.current.t > 80) spin.current.velocity = 0;
    drag.current = null;
    spin.current.resumeAt = performance.now() + RESUME_DELAY;
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.turntable} ${styles.model} ${ready ? styles.modelReady : ''} ${className}`}
      role="img"
      aria-label={`${alt} (döndürmek için sürükle)`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}

function materialsOf(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function texturesOf(mat: THREE.Material): THREE.Texture[] {
  return Object.values(mat).filter((v): v is THREE.Texture => v instanceof THREE.Texture);
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const mat of materialsOf(mesh)) {
      for (const tex of texturesOf(mat)) tex.dispose();
      mat.dispose();
    }
  });
}
