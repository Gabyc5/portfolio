// terrain.js
(function () {
  var canvas = document.getElementById('terrain-canvas');
  if (!canvas) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4.5, 9);
  camera.lookAt(0, -0.5, 0);

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  var segments = 90;
  var geometry = new THREE.PlaneGeometry(24, 18, segments, segments);
  geometry.rotateX(-Math.PI / 2.3);

  var posAttr = geometry.attributes.position;
  var vertCount = posAttr.count;

  var baseX = new Float32Array(vertCount);
  var baseZ = new Float32Array(vertCount);
  var baseY = new Float32Array(vertCount);

  function terrainNoise(x, z) {
    return Math.sin(x * 0.6) * Math.cos(z * 0.5) * 0.6
      + Math.sin(x * 1.3 + 0.8) * Math.cos(z * 0.9 - 0.5) * 0.35
      + Math.sin(x * 2.5 - 1.0) * Math.cos(z * 1.8 + 1.2) * 0.15
      + Math.sin(x * 0.3 + 2.0) * Math.cos(z * 0.25) * 0.4;
  }

  for (var i = 0; i < vertCount; i++) {
    var x = posAttr.getX(i);
    var z = posAttr.getZ(i);
    baseX[i] = x;
    baseZ[i] = z;
    var y = terrainNoise(x, z);
    posAttr.setY(i, y);
    baseY[i] = y;
  }

  geometry.computeVertexNormals();

  // Forest green wireframe
  var material = new THREE.MeshBasicMaterial({
    color: 0x4A7C5C,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });

  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -1.5;
  scene.add(mesh);

  var pointer = { x: 0, y: 0 };
  var pointerSmooth = { x: 0, y: 0 };
  var pointerActive = false;

  function onPointerMove(px, py) {
    pointer.x = (px / window.innerWidth - 0.5) * 2;
    pointer.y = (py / window.innerHeight - 0.5) * 2;
    pointerActive = true;
  }

  document.addEventListener('mousemove', function (e) {
    onPointerMove(e.clientX, e.clientY);
  });

  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 0) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var t = clock.getElapsedTime() * 1.4;

    pointerSmooth.x += (pointer.x - pointerSmooth.x) * 0.03;
    pointerSmooth.y += (pointer.y - pointerSmooth.y) * 0.03;

    for (var i = 0; i < vertCount; i++) {
      var x = baseX[i];
      var z = baseZ[i];

      var wave1 = Math.sin(x * 0.4 + t * 0.35) * Math.cos(z * 0.3 + t * 0.25) * 0.45;
      var wave2 = Math.sin(x * 0.8 - t * 0.5 + 1.5) * Math.cos(z * 0.6 + t * 0.4) * 0.25;
      var wave3 = Math.sin(x * 1.6 + t * 0.7) * Math.cos(z * 1.2 - t * 0.6) * 0.1;

      var pointerInfluence = 0;
      if (pointerActive) {
        var px = pointerSmooth.x * 12;
        var pz = pointerSmooth.y * 9;
        var dist = Math.sqrt((x - px) * (x - px) + (z - pz) * (z - pz));
        pointerInfluence = Math.exp(-dist * 0.12) * Math.sin(dist * 1.0 - t * 3) * 0.5;
      }

      posAttr.setY(i, baseY[i] + wave1 + wave2 + wave3 + pointerInfluence);
    }

    posAttr.needsUpdate = true;

    var camTargetX = pointerSmooth.x * 1.5;
    var camTargetY = 4.5 + pointerSmooth.y * 0.5;
    camera.position.x += (camTargetX - camera.position.x) * 0.02;
    camera.position.y += (camTargetY - camera.position.y) * 0.02;
    camera.lookAt(0, -0.5, 0);

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
