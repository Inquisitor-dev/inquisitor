'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import styles from './CharacterTurntable.module.scss';
import { TurntableMotion, type MotionCommand } from './turntableMotion';
import { isCoveredByModal } from '@/shared/lib/modalCover';

// Sürüklerken bir piksel başına dönüş (radyan)
const DRAG_RAD_PER_PX = 0.012;
// Animasyona girerken ve dinlenme pozuna dönerken geçiş süresi (sn)
const FADE_IN_SECONDS = 0.3;
const FADE_OUT_SECONDS = 0.5;
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

// Menüdeki ve gardıroptaki gerçek zamanlı 3D karakter: yüzü oyuncuya dönükken animasyonunu bir kez
// oynatır, sonra animasyonsuz bir tur atar (turntableMotion.ts). Sürüklenince elle çevrilir.
export default function CharacterModelView({ src, className = '', alt, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const motion = useRef<TurntableMotion | null>(null);
  // Hareketin istediği animasyon komutunu uygular (yükleme sonrası kurulur)
  const applyCommand = useRef<(command: MotionCommand) => void>(() => {});
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Sahne bir kez kurulur; karakter değişince yalnızca model değişir. Eskiden her değişimde yeni bir WebGL
  // bağlamı açılıyor, ortam ışığı yeniden hesaplanıyor ve gölgelendiriciler yeniden derleniyordu
  // (karakter seçerken takılma). Yükleme etkisi sahneye bu ref üzerinden ulaşır.
  const stageRef = useRef<{
    renderer: THREE.WebGLRenderer;
    pivot: THREE.Group;
    mixer: THREE.AnimationMixer | null;
  } | null>(null);

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
    // Yüksek DPI ekranlarda 2 kat çizim gereksiz yere pahalı; 1,5 kat gözle ayırt edilmiyor
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
    const stage = { renderer, pivot, mixer: null as THREE.AnimationMixer | null };
    stageRef.current = stage;

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

    const timer = new THREE.Timer();
    timer.connect(document);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      timer.update(now);
      if (disposed || !visible || isCoveredByModal(container)) return;
      const dt = Math.min(timer.getDelta(), 0.1);
      const turntable = motion.current;
      // Model yüklenmeden hareket başlamaz (önde bekleme yükleme sırasında tükenmesin)
      if (!turntable || !pivot.children.length) return;
      applyCommand.current(turntable.update(dt));
      pivot.rotation.y = turntable.yaw;
      if (stage.mixer && !reduceMotion) stage.mixer.update(dt);
      // Uçtan uca testler ve hata ayıklama için o anki aşama
      if (container.dataset.motion !== turntable.phase) container.dataset.motion = turntable.phase;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      stageRef.current = null;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      timer.dispose();
      stage.mixer?.stopAllAction();
      applyCommand.current = () => {};
      motion.current = null;
      disposeObject(scene);
      envMap.dispose();
      renderer.dispose();
      // Tarayıcının açık bağlam sınırına takılmasın
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  // Karakter değişince yalnızca model yüklenir; yeni model gelene kadar eskisi görünür kalır
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      src,
      (gltf) => {
        if (cancelled || stageRef.current !== stage) {
          disposeObject(gltf.scene);
          return;
        }
        const { renderer, pivot } = stage;
        // Önceki karakter bırakılır
        stage.mixer?.stopAllAction();
        stage.mixer = null;
        applyCommand.current = () => {};
        for (const old of [...pivot.children]) {
          pivot.remove(old);
          disposeObject(old);
        }
        pivot.rotation.y = 0;

        const turntable = new TurntableMotion(reduceMotion);
        motion.current = turntable;
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
          const clip = gltf.animations[0];
          const animMixer = new THREE.AnimationMixer(model);
          stage.mixer = animMixer;
          // Dinlenme pozu klibin ilk karesidir; tur bu pozla atılır
          const rest = animMixer.clipAction(THREE.AnimationUtils.subclip(clip, 'rest', 0, 1));
          const play = animMixer.clipAction(clip);
          play.setLoop(THREE.LoopOnce, 1);
          play.clampWhenFinished = true;
          rest.play();
          animMixer.update(0);

          const fade = (from: THREE.AnimationAction, to: THREE.AnimationAction, seconds: number) => {
            to.reset();
            to.play();
            from.crossFadeTo(to, seconds, false);
          };
          // Bitmiş (son karede duran) klip de geçişle dinlenme pozuna bırakılır
          applyCommand.current = (command) => {
            if (command === 'play') fade(rest, play, FADE_IN_SECONDS);
            else if (command === 'rest') fade(play, rest, FADE_OUT_SECONDS);
          };
          animMixer.addEventListener('finished', (e) => {
            if (e.action === play) applyCommand.current(turntable.clipFinished());
          });
          turntable.setClip(clip.duration);
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
        setReady(true);
      },
      undefined,
      (err) => {
        console.error('Karakter modeli yüklenemedi:', err);
        if (!cancelled) onErrorRef.current();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [src]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, t: performance.now() };
    // Oynayan animasyon dinlenme pozuna döner
    if (motion.current) applyCommand.current(motion.current.beginDrag());
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const now = performance.now();
    const delta = (e.clientX - drag.current.x) * DRAG_RAD_PER_PX;
    const dt = Math.max((now - drag.current.t) / 1000, 1 / 240);
    // Sağa sürükleyince karakterin önü sağa döner
    motion.current?.dragBy(delta, delta / dt);
    drag.current = { x: e.clientX, t: now };
  };

  const endDrag = () => {
    if (!drag.current) return;
    // Parmak kalktıktan sonra bir süre hareket etmediyse savurma yok
    motion.current?.endDrag(performance.now() - drag.current.t <= 80);
    drag.current = null;
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
