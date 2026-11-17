import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero-canvas');
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.03);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 4, 15);
  camera.lookAt(0, 1, 0);

  // Lumières
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const rimLight = new THREE.PointLight(0x06b6d4, 50, 20); // Lumière cyan
  rimLight.position.set(-5, 3, 2);
  scene.add(rimLight);

  // --- 1. MAISON MOBILE (Mobile Home) ---
  const houseGroup = new THREE.Group();
  houseGroup.position.set(-3, 0, 0);
  scene.add(houseGroup);

  // Base
  const houseMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2, metalness: 0.1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 2), houseMat);
  base.position.y = 1.1;
  houseGroup.add(base);

  // Toit (légèrement en pente)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 2.4), roofMat);
  roof.position.set(0, 2.4, 0);
  roof.rotation.z = 0.05;
  houseGroup.add(roof);

  // Fenêtres
  const winMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x333333, roughness: 0.1, metalness: 0.9 });
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), winMat);
  win1.position.set(-1, 1.4, 1.05);
  houseGroup.add(win1);
  const win2 = win1.clone();
  win2.position.set(1, 1.4, 1.05);
  houseGroup.add(win2);

  // Roues
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
  wheelGeo.rotateX(Math.PI / 2);
  [-1.2, 1.2].forEach(x => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, 0.4, 1);
    houseGroup.add(w);
  });

  // --- 2. CONTENEUR MARITIME ---
  const containerGroup = new THREE.Group();
  containerGroup.position.set(3, 0, -1);
  scene.add(containerGroup);

  // Base conteneur (Bleu)
  const contMat = new THREE.MeshStandardMaterial({ color: 0x0a4a8a, roughness: 0.6, metalness: 0.3 });
  const contBase = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2.4), contMat);
  contBase.position.y = 1.3;
  containerGroup.add(contBase);

  // Détails du conteneur (lignes pour l'effet ondulé)
  const edges = new THREE.EdgesGeometry(contBase.geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x113366 }));
  line.position.copy(contBase.position);
  containerGroup.add(line);

  // --- ANIMATION & INTERACTION ---
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    // Flottement doux
    houseGroup.position.y = Math.sin(t * 1.5) * 0.1;
    containerGroup.position.y = Math.cos(t * 1.2) * 0.15;

    // Rotation très lente
    houseGroup.rotation.y = Math.sin(t * 0.2) * 0.2 + 0.2;
    containerGroup.rotation.y = Math.cos(t * 0.2) * 0.2 - 0.2;

    // Mouvement caméra (Parallaxe)
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
    camera.position.y += (4 + mouse.y * 1 - camera.position.y) * 0.05;
    camera.lookAt(0, 1, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
