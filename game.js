/**
 * 2048 Cubes 3D - Streamlined Mechanics Engine
 */
const ActiveGameEngine = {
    score: 0,
    hiScore: parseInt(localStorage.getItem("3d_cubes_hiScore") || 0),
    nextCubeValue: 2,
    
    // Core Engine Holders
    scene: null,
    camera: null,
    renderer: null,
    world: null,
    activeMeshList: [],
    physicsBodies: [],

    // Game Matrix Variables
    currentAimX: 0,
    containerWidth: 4,
    spawnHeight: 5,
    cubeSize: 0.8,

    init() {
        this.initGraphics();
        this.initPhysics();
        this.setupInputControllers();
        
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
        this.camera = new THREE.PerspectiveCamera(60, viewport.clientWidth / viewport.clientHeight, 0.1, 100);
        this.camera.position.set(0, 4, 7);
        this.camera.lookAt(0, 2, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Basic Ambient and Direct Stage Lighting
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Ground Mesh
        const floorGeo = new THREE.BoxGeometry(this.containerWidth, 0.2, this.containerWidth);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x252a41, roughness: 0.4 });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.y = -0.1;
        this.scene.add(floorMesh);
    },

    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Downward Gravity Acceleration

        // Ground Physics Body
        const groundBody = new CANNON.Body({
            mass: 0, 
            shape: new CANNON.Box(new CANNON.Vec3(this.containerWidth / 2, 0.1, this.containerWidth / 2))
        });
        groundBody.position.set(0, -0.1, 0);
        this.world.addBody(groundBody);
    },

    setupInputControllers() {
        const viewport = document.getElementById('game-viewport');
        const aimLine = document.getElementById('aim-line');
        const dropButton = document.getElementById('btn-drop-cube');

        // Track Horizontal Slide Positions
        const handleMove = (clientX) => {
            const rect = viewport.getBoundingClientRect();
            const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
            const maxRange = (this.containerWidth / 2) - (this.cubeSize / 2);
            
            this.currentAimX = Math.max(-maxRange, Math.min(maxRange, normalizedX * maxRange));
            aimLine.style.left = `${((this.currentAimX + maxRange) / (maxRange * 2)) * 100}%`;
        };

        viewport.addEventListener('mousemove', (e) => handleMove(e.clientX));
        viewport.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) handleMove(e.touches[0].clientX);
        });

        if (dropButton) {
            dropButton.addEventListener('click', () => this.dropCube());
        }
    },

    dropCube() {
        const val = this.nextCubeValue;
        
        // 1. Create Render Mesh
        let colorConfig = { bg: "#ff2a74" };
        if (window.SaveManager && typeof window.SaveManager.getColorConfiguration === 'function') {
            colorConfig = window.SaveManager.getColorConfiguration(val);
        }

        const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorConfig.bg) });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.currentAimX, this.spawnHeight, 0);
        mesh.userData = { value: val };
        
        this.scene.add(mesh);
        this.activeMeshList.push(mesh);

        // 2. Create Physics Body
        const halfSize = this.cubeSize / 2;
        const body = new CANNON.Body({
            mass: 1.0,
            shape: new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize)),
            position: new CANNON.Vec3(this.currentAimX, this.spawnHeight, 0)
        });
        
        body.linearFactor.set(1, 1, 0);  // Restrict to 2D Plane movement path
        body.angularFactor.set(0, 0, 1); // Only rotate around Z-axis forward
        
        this.world.addBody(body);
        this.physicsBodies.push(body);

        // 3. Score Up and Cycle Next Cube
        this.score += val;
        if (this.score > this.hiScore) this.hiScore = this.score;
        
        const choices =;
        this.nextCubeValue = choices[Math.floor(Math.random() * choices.length)];

        this.updateUI();
    },

    updateUI() {
        if (window.CubeTextManager) {
            window.CubeTextManager.updateElementText('ui-current-score', this.score);
            window.CubeTextManager.updateElementText('ui-best-score', this.hiScore);
        } else {
            document.getElementById('ui-current-score').innerText = this.score;
            document.getElementById('ui-best-score').innerText = this.hiScore;
        }

        if (window.SaveManager && typeof window.SaveManager.updatePreviewBoxStyling === 'function') {
            window.SaveManager.updatePreviewBoxStyling(this.nextCubeValue);
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.world) this.world.step(1 / 60);

        // Sync Graphics Positions directly from Physics simulation tracking coordinates
        for (let i = 0; i < this.activeMeshList.length; i++) {
            if (this.activeMeshList[i] && this.physicsBodies[i]) {
                this.activeMeshList[i].position.copy(this.physicsBodies[i].position);
                this.activeMeshList[i].quaternion.copy(this.physicsBodies[i].quaternion);
            }
        }

        if (this.renderer) this.renderer.render(this.scene, this.camera);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    ActiveGameEngine.init();
    
    window.addEventListener('resize', () => {
        const vp = document.getElementById('game-viewport');
        if (ActiveGameEngine.camera && ActiveGameEngine.renderer && vp) {
            ActiveGameEngine.camera.aspect = vp.clientWidth / vp.clientHeight;
            ActiveGameEngine.camera.updateProjectionMatrix();
            ActiveGameEngine.renderer.setSize(vp.clientWidth, vp.clientHeight);
        }
    });
});
