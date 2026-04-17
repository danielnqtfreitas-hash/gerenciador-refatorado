const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve os ficheiros da pasta public que está na raiz
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});
