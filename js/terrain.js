// terrain.js — Animated 3D topographic mesh for hero background
(function () {
  var canvas = document.getElementById('terrain-canvas');
  if (!canvas) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Terrain geometry
  var segments = 72;
  var geometry = new THREE.PlaneGeometry(22, 16, segments, segments);
  geometry.rotateX(-Math.PI / 2.3);

  // Simple noise function for terrain
  function noise(x, z) {
    return Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.5
      + Math.sin(x * 1.5 + 1.2) * Math.cos(z * 1.1 - 0.8) * 0.3
      + Math.sin(x * 2.8 - 0.5) * Math.cos(z * 2.2 + 1.5) * 0.15;
  }

  var posAttr = geometry.attributes.position;
  var originalY = new Float32Array(posAttr.count);

  for (var i = 0; i < posAttr.count; i++) {
    var x = posAttr.getX(i);
    var z = posAttr.getZ(i);
    var y = noise(x, z);
    posAttr.setY(i, y);
    originalY[i] = y;
  }

  geometry.computeVertexNormals();

  // Wireframe material in a warm muted tone
  var material = new THREE.MeshBasicMaterial({
    color: 0x8B7E74,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  });

  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -1.5;
  scene.add(mesh);

  // Mouse tracking for subtle parallax
  var mouseX = 0;
  var mouseY = 0;
  var targetRotX = 0;
  var targetRotY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Animate
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var t = clock.getElapsedTime() * 0.3;

    // Gentle wave animation
    for (var i = 0; i < posAttr.count; i++) {
      var x = posAttr.getX(i);
      var z = posAttr.getZ(i);
      var wave = Math.sin(x * 0.5 + t) * Math.cos(z * 0.4 + t * 0.7) * 0.08;
      posAttr.setY(i, originalY[i] + wave);
    }
    posAttr.needsUpdate = true;

    // Subtle mouse parallax on camera
    targetRotY += (mouseX * 0.15 - targetRotY) * 0.02;
    targetRotX += (mouseY * 0.08 - targetRotX) * 0.02;

    camera.position.x = targetRotY * 2;
    camera.position.y = 5 + targetRotX;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
