/**
 * 2048 Cubes 3D - Typography & Suffix Scaling Engine
 */
const CubeTextManager = {
    suffixes: ['', 'K', 'M', 'G', 'T', 'P'],

    formatValue(value) {
        if (value === null || value === undefined || isNaN(value)) return '0';
        if (value < 1000) return value.toString();

        const tier = Math.floor(Math.log10(value) / 3);
        if (tier >= this.suffixes.length) return value.toExponential(1);

        const suffix = this.suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaledValue = value / scale;

        const formattedNumber = scaledValue % 1 === 0 
            ? scaledValue.toFixed(0) 
            : scaledValue.toFixed(1);

        return `${formattedNumber}${suffix}`;
    },

    updateElementText(element, rawValue) {
        const target = typeof element === 'string' ? document.getElementById(element) : element;
        if (!target) return;
        target.innerText = this.formatValue(rawValue);
    }
};

window.CubeTextManager = CubeTextManager;
