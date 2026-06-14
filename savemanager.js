/**
 * 2048 Cubes 3D - Save State & Aesthetic Asset Lifecycle Manager
 */
const SaveManager = {
    storageKey: "3d_cubes_2048_save",
    autoSaveInterval: null,
    colorPalette: null,

    // Async system initialization loop wrapper
    async init(gameEngineReference) {
        this.game = gameEngineReference;
        
        // Asynchronously preload aesthetic texture lookups directly from project workspace
        await this.loadColorPalette();
        
        this.loadState();
        this.startAutoSaveLoop();
    },

    // Fetch and bind color profiles dynamically
    async loadColorPalette() {
        try {
            const response = await fetch('cube-colors.json');
            this.colorPalette = await response.json();
            console.log("🎨 Aesthetic lookup asset 'cube-colors.json' bound successfully.");
        } catch (error) {
            console.error("❌ Failed to parse cube-colors.json file structure:", error);
            // Bulletproof in-memory fallback asset layer 
            this.colorPalette = {
                colors: { "default": { "bg": "#ff2a74", "text": "#ffffff", "glow": "#ff2a74", "intensity": 1.0 } }
            };
        }
    },

    // Public getter engine utility function for your 3D cube mesh generation script
    getColorConfiguration(cubeValue) {
        if (!this.colorPalette || !this.colorPalette.colors) {
            return { bg: "#ff2a74", text: "#ffffff", glow: "#ff2a74", intensity: 1.0 };
        }
        return this.colorPalette.colors[cubeValue] || this.colorPalette.colors["default"];
    },

    captureCurrentState() {
        const currentScore = this.game?.score || 0;
        const currentHiScore = this.game?.hiScore || 0;
        const currentNext = this.game?.nextCubeValue || 2;
        const runtimeCubes = this.game?.activeMeshList || [];
        
        const serializedCubes = runtimeCubes.map((cube, index) => {
            return {
                id: `cube_${Date.now()}_${index}`,
                cubeVal: cube.userData?.value || 2,
                pos: {
                    x: parseFloat(cube.position.x.toFixed(3)),
                    y: parseFloat(cube.position.y.toFixed(3)),
                    z: parseFloat(cube.position.z.toFixed(3))
                }
            };
        });

        return {
            meta: {
                version: "1.0.0",
                lastSaved: new Date().toISOString(),
                isNewGame: serializedCubes.length === 0
            },
            stats: {
                score: currentScore,
                hiScore: currentHiScore
            },
            nextCube: {
                cubeVal: currentNext
            },
            cubes: serializedCubes
        };
    },

    saveState() {
        const stateData = this.captureCurrentState();
        localStorage.setItem(this.storageKey, JSON.stringify(stateData));
        localStorage.setItem("3d_cubes_hiScore", stateData.stats.hiScore);
        
        // Dynamically update UI micro preview container box styling to keep lookups sync'd
        this.updatePreviewBoxStyling(stateData.nextCube.cubeVal);
        
        console.log("💾 save.json context synchronized across operational client nodes.");
        return stateData;
    },

    loadState() {
        const locallyStored = localStorage.getItem(this.storageKey);
        if (!locallyStored) return null;
        
        const parsedState = JSON.parse(locallyStored);
        if(this.game) {
            this.game.score = parsedState.stats.score;
            this.game.hiScore = parsedState.stats.hiScore;
        }
        return parsedState;
    },

    // Reflect palette configurations instantly into native UI component layouts
    updatePreviewBoxStyling(nextValue) {
        const previewElement = document.getElementById('ui-next-preview-box');
        if (!previewElement) return;

        const aestheticProperties = this.getColorConfiguration(nextValue);
        previewElement.innerText = nextValue;
        previewElement.style.backgroundColor = aestheticProperties.bg;
        previewElement.style.color = aestheticProperties.text;
        previewElement.style.boxShadow = `0 0 12px ${aestheticProperties.glow}`;
    },

    startAutoSaveLoop() {
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = setInterval(() => {
            this.saveState();
        }, 7000);
    },

    purgeSave() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem("3d_cubes_hiScore");
    }
};

window.SaveManager = SaveManager;
