const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 80;

// Configuration du moteur de vue EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware pour servir les fichiers statiques (images SVG)
app.use('/imgs', express.static(path.join(__dirname, 'imgs')));

// Dossier contenant les pages
const pagesDir = path.join(__dirname, 'web');

// Charger automatiquement les pages
fs.readdirSync(pagesDir).forEach(file => {
    if (file.endsWith('.js')) {
        const pageName = path.basename(file, '.js');
        const pageModule = require(path.join(pagesDir, file));

        const route = pageName === 'index' ? '/' : `/${pageName}`;
        app.get(route, (req, res) => {
            res.send(pageModule.render());
        });
    }
});

// Route pour servir le plateau d'échecs avec les SVG
app.get('/chessboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'chessboard.html'));
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});