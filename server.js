/*
Run the following:
npm init -y
npm install @google/generative-ai
npm install express
npm install dotenv
npm install cors

node server.js to run the program in localhost
*/

const express = require('express');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
const port = 3000;

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(path.join(__dirname, '/' )));

app.post('/generate', async (req, res) => {
    try {
    const prompt = req.body.prompt;
    
    if (!prompt || prompt.trim() === "") {
        return res.status(400).json({ error: 'Prompt is required' });
    }
  
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        systemInstruction: "You are an AI assistant specializing in solar energy engineering. Analyze the solar potential of a given location using real-world data.\n\n                **Location:** ${location}\n                **Coordinates:** Latitude u are an AI assistant specializing in solar energy engineering. \n${lat}, Longitude ${lon}\n\n                Based on these factors, determine:\n                1. Solar Irradiance – Availability of sunlight in kWh/m²/day.\n2. Weather Patterns – Cloud cover, rainfall, temperature.\n3. Topography & Land Use – Zoning laws, vegetation, restrictions.\n4. Energy Demand & Infrastructure – Proximity to grid, demand centers.\n\nProvide a Solar Farm Suitability Score (1-10) and a short explanation.",
    });
  
    const generationConfig = {
        temperature: 0.15,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 65536,
        responseMimeType: "text/plain",
    };
  
    const chatSession = model.startChat({
        generationConfig,
        history: [],
    });
  
    const result = await chatSession.sendMessage(prompt); // Use the prompt from the request
  
    res.json({ result: result.response.text() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
});
  
app.listen(port, () => {
    console.log(`UwU Server listening at http://localhost:${port}`);
});