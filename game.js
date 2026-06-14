/**
 * 2048 Cubes 3D - Mechanics Engine & Physics Router
 */
const ActiveGameEngine = {
    score: 0,
    hiScore: parseInt(localStorage.getItem("3d_cubes_hiScore") || 0),
    nextCubeValue: 2,
    activeMeshList: [], // Track graphics meshes

    // Engine Core Elements
    scene: null,
    camera: null,
    renderer: null,
    world: null,       // Physics world instance
    physicsBodies: [], // Track rigid bodies

    // Spawning / Drop parameters
    currentAimX: 0,
    containerWidth: 4, // 3D box boundary sizes
    spawnHeight: 5,

    init() {
        this.initGraphics();
        this.initPhysics();
        this.setupInputControllers();
        
        // Boot save hooks
        if (window.SaveManager) {
            window.SaveManager.init(this);
        }

        this.updateUI();
        this.animate();
    },

    initGraphics() {
        const viewport = document.getElementById('game-viewport');
        const canvas = document.getElementById('webgl-render-target');

        this.scene = new THREE.Scene();
        this.scene.background = null; // Background defined by CSS gradients

        this.camera = new THREE.PerspectiveCamera(60, viewport.clientWidth / viewport.clientHeight, 0.1, 100);
        this.camera.position.set(0, 4, 7);
        this.camera.lookAt(0, 2, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Add ambient and direct workspace lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Visual Transparent Glass Outer Tray Container base
        const floorGeo = new THREE.BoxGeometry(this.containerWidth, 0.2, this.containerWidth);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x252a41, roughness: 0.4 });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.y = -0.1;
        this.scene.add(floorMesh);
    },

    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Real world downward gravity acceleration axis
        this.world.broadphase = new CANNON.NaiveBroadphase();

        // Physics Floor boundary plane matching graphics mesh
        const groundMaterial = new CANNON.Material("groundMaterial");
        const groundBody = new CANNON.Body({
            mass: 0, // Static physical node object plane (never falls)
            shape: new CANNON.Box(new CANNON.Vec3(this.containerWidth / 2, 0.1, this.containerWidth / 2)),
            material: groundMaterial
        });
        groundBody.position.set(0, -0.1, 0);
        this.world.addBody(groundBody);
    },

    setupInputControllers() {
        const viewport = document.getElementById('game-viewport');
        const aimLine = document.getElementById('aim-line');

        // Handle mouse and sliding touch move controls to calculate aiming alignment parameters
        const handleMove = (clientX) => {
            const rect = viewport.getBoundingClientRect();
            const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1; // Translate position scale index (-1 to 1)
            
            // Constrain aiming path ranges inside the bounding walls safely
            const maxRange = (this.containerWidth / 2) - 0.4;
            this.currentAimX = normalizedX * maxRange;

            // Reflect visually onto the screen HUD guide line properties
            aimLine.style.left = `${((this.currentAimX + maxRange) / (maxRange * 2)) * 100}%`;
        };

        viewport.addEventListener('mousemove', (e) => handleMove(e.clientX));
        viewport.addEventListener('touchmove', (e) => {
            if(e.touches.length > 0) handleMove(e.touches[0].clientX);
        });

        // Fire physical block spawn drop on mouse release click or screen press release tap
        viewport.addEventListener('mouseup', () => this.dropCube());
        viewport.addEventListener('touchend', () => this.dropCube());
    },

    dropCube() {
        const valueToDrop = this.nextCubeValue;
        
        // 1. Structural Graphic Matrix Layer Definition
        const size = 0.8;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Grab hex profile styles safely directly via decoupled save palette configurations
        let colorConfig = { bg: "#ff2a74" };
        if(window.SaveManager && typeof window.SaveManager.getColorConfiguration === 'function') {
            colorConfig = window.SaveManager.getColorConfiguration(valueToDrop);
        }

        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(colorConfig.bg),
            roughness: 0.2,
            metalness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.currentAimX, this.spawnHeight, 0);
        mesh.userData = { value: valueToDrop };
        this.scene.add(mesh);
        this.activeMeshList.push(mesh);

        // 2. Physics Rigidbody Framework Configuration
        const halfSize = size / 2;
        const boxShape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));
        const boxBody = new CANNON.Body({
            mass: 1.0, // Dynamic object mass to engage physics properties calculation loops
            shape: boxShape,
            position: new CANNON.Vec3(this.currentAimX, this.spawnHeight, 0)
        });
        
        // Limit movements strictly inside a 2D viewport plane track path frame profile
        boxBody.linearFactor.set(1, 1, 0); 
        
        this.world.addBody(boxBody);
        this.physicsBodies.push(boxBody);

        // 3. Roll core telemetry attributes forward to next tile blocks configurations
        this.score += valueToDrop;
        if(this.score > this.hiScore) this.hiScore = this.score;
        
        const tierPool =;
        this.nextCubeValue = tierPool[Math.floor(Math.random() * tierPool.length)];

        this.updateUI();
    },

    updateUI() {
        if (window.CubeTextManager) {
            window.CubeTextManager.updateElementText('ui-current-score', this.score);
            window.CubeTextManager.updateElementText('ui-best-score', this.hiScore);
        }
        if (window.SaveManager && typeof window.SaveManager.updatePreviewBoxStyling === 'function') {
            window.SaveManager.updatePreviewBoxStyling(this.nextCubeValue);
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        // Step active physics loop timeline forward
        if(this.world) {
            this.world.step(1 / 60);
        }

        // Map computed rigidbody vectors back over to graphics mesh coordinates structures
        for (let i = 0; i < this.activeMeshList.length; i++) {
            const mesh = this.activeMeshList[i];
            const body = this.physicsBodies[i];

            if(mesh && body) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        }

        if(this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
};

// System entry loader
window.addEventListener('DOMContentLoaded', () => {
    ActiveGameEngine.init();
    
    window.addEventListener('resize', () => {
        const viewport = document.getElementById('game-viewport');
        if(ActiveGameEngine.camera && ActiveGameEngine.renderer) {
            ActiveGameEngine.camera.aspect = viewport.clientWidth / viewport.clientHeight;
            ActiveGameEngine.camera.updateProjectionMatrix();
            ActiveGameEngine.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        }
    });
});
