
    import * as THREE from 'three';
    import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';

    let scene, camera, renderer, controls;
    const loadingDiv = document.getElementById('loading');

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      loadMolecule();
      animate();
    }

    function loadMolecule() {
      fetch('molecule.mol')
        .then(response => response.text())
        .then(molData => {
           moleculeGroup = parseMolFile(molData);
          scene.add(moleculeGroup);

          const box = new THREE.Box3().setFromObject(moleculeGroup);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          camera.position.copy(center);
          camera.position.z += maxDim * 3;
          controls.target.copy(center);

          loadingDiv.style.display = 'none';
        })
        .catch(error => {
          console.error('Error:', error);
          loadingDiv.textContent = 'Error loading molecule';
        });
    }

    function parseMolFile(molData) {
      // Split lines without trimming to preserve fixed-width columns
      const lines = molData.split('\n').map(line => line.replace(/\r/g, ''));
      const atoms = [];
      const bonds = [];

      // Parse counts from the header line (line 3)
      const headerLine = lines[3];
      const numAtoms = parseInt(headerLine.substring(0, 3).trim(), 10);
      const numBonds = parseInt(headerLine.substring(3, 6).trim(), 10);

      // Parse atoms (starting from line 4)
      for (let i = 0; i < numAtoms; i++) {
        const line = lines[i + 4];
        const x = parseFloat(line.substring(0, 10).trim());
        const y = parseFloat(line.substring(10, 20).trim());
        const z = parseFloat(line.substring(20, 30).trim());
        const element = line.substring(31, 34).trim();
        atoms.push({
          position: new THREE.Vector3(x, y, z),
          element: element
        });
      }

      // Parse bonds (starting after atoms)
      const bondStartLine = 4 + numAtoms;
      for (let i = 0; i < numBonds; i++) {
        const line = lines[bondStartLine + i];
        const atom1 = parseInt(line.substring(0, 3).trim(), 10) - 1; // Convert to 0-based index
        const atom2 = parseInt(line.substring(3, 6).trim(), 10) - 1;
        const order = parseInt(line.substring(6, 9).trim(), 10);
        bonds.push({ atom1, atom2, order });
      }

      return createMoleculeGeometry(atoms, bonds);
    }

    function createMoleculeGeometry(atoms, bonds) {
      const group = new THREE.Group();

      // Create atoms
      atoms.forEach((atom) => {
        const radius = atom.element === 'H' ? 0.1 : 0.2;
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: atom.element === 'H' ? 0xffffff : 0x808080,
          shininess: 100
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(atom.position);
        group.add(sphere);
      });

      // Create bonds
      bonds.forEach(bond => {
        const atom1 = atoms[bond.atom1];
        const atom2 = atoms[bond.atom2];
        const start = atom1.position;
        const end = atom2.position;

        const createBond = (offset) => {
          const direction = new THREE.Vector3().subVectors(end, start);
          const length = direction.length();
          const geometry = new THREE.CylinderGeometry(0.03, 0.03, length, 8);
          const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
          const cylinder = new THREE.Mesh(geometry, material);

          // Position the cylinder
          const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
          cylinder.position.copy(midpoint);

          // Orient the cylinder
          cylinder.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
          );

          // Apply offset for double/triple bonds
          if (offset !== 0) {
            const axis = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
            cylinder.position.add(axis.multiplyScalar(offset));
          }

          return cylinder;
        };

        switch (bond.order) {
          case 2:
            group.add(createBond(0.05));
            group.add(createBond(-0.05));
            break;
          case 3:
            group.add(createBond(0.1));
            group.add(createBond(0));
            group.add(createBond(-0.1));
            break;
          default:
            group.add(createBond(0));
            break;
        }
      });

      return group;
    }
    let moleculeGroup = new THREE.Group();  // Declare at a higher scope

function animate() {
    requestAnimationFrame(animate);
    
    // Auto-rotate the molecule
    if (moleculeGroup) {
        moleculeGroup.rotation.z += 0.005;
        moleculeGroup.rotation.y += 0.005; // Rotate around Y-axis
    }
    
    controls.update();
    renderer.render(scene, camera);
}


    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);
    init();
