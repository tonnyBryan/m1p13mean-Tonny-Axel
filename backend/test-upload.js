process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const cloudinary = require('cloudinary').v2;
const dns = require('node:dns');

dns.setDefaultResultOrder('ipv4first');

cloudinary.config({
    cloud_name: 'dqooludk7',
    api_key: '713936782617397',
    api_secret: 'TON_SECRET',
    secure: true,
    // AJOUTE CES DEUX LIGNES :
    timeout: 120000,        // 120 secondes (le réseau peut être lent)
    connection_timeout: 60000 // 60 secondes pour établir le contact
});

console.log("Tentative d'upload (patience, ça peut prendre du temps)...");

cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
    { resource_type: "image" },
    function(error, result) {
        if(error) {
            console.log("ERREUR DÉTAILLÉE:", JSON.stringify(error, null, 2));
        } else {
            console.log("SUCCÈS:", result.secure_url);
        }
    }
);