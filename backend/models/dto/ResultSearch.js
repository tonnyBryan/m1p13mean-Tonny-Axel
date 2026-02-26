// models/dto/ResultSearch.js

class ResultSearch {
    /**
     * @param {Object} params
     * @param {'product'|'boutique'} params.type - Type de résultat
     * @param {string} params.id - ID de l'objet (MongoDB)
     * @param {string} params.name - Nom à afficher (produit ou boutique)
     * @param {string} params.description - Description
     * @param {string|null} params.image - Image à afficher (produit ou logo boutique)
     * @param {string} params.link - Lien vers la page produit ou boutique
     */
    constructor({ type, id, name, description, image = null, link }) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.description = description;
        this.image = image;
        this.link = link;
    }
}

module.exports = ResultSearch;
