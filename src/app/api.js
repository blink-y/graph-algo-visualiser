const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/graph', (req, res) => {
    console.log('Received edges:', req.body.links); // Log the received edges
    res.status(200).json({
        message: 'Graph edges received',
        data: req.body.links // Echo back the received edges
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});