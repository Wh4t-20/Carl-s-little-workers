const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
const port = 3000;

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("🚨 Missing API Key! Add it to your .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

app.post('/generate', async (req, res) => {
    try {
        const { prompt, location, lat, lon } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(`Location: ${location}, Coordinates: (${lat}, ${lon}). ${prompt}`);

        res.json({ result: result.response.text() });
    } catch (error) {
        console.error("🚨 AI Error:", error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
