// ...existing code...

/**
 * Génère un SKU à partir du nom : remplace les espaces par '_' et ajoute un nombre aléatoire à 5 chiffres
 * Exemple: "Wireless Mouse" -> "Wireless_Mouse_48291"
 */
function generateSku(name = '') {
    const base = String(name || '').trim().replace(/\s+/g, '_') || 'product';
    const rand = Math.floor(10000 + Math.random() * 90000); // 5 chiffres
    return `${base}_${rand}`;
}

module.exports = {
    generateSku
};
