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
app.use(express.static(path.join(__dirname, '/' )));

app.post('/generate', async (req, res) => {
    try {
    const prompt = req.body.prompt;
    
    if (!prompt || prompt.trim() === "") {
        return res.status(400).json({ error: 'Prompt is required' });
    }

  
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        systemInstruction: "You are an AI assistant specializing in solar energy engineering, designed to assess optimal locations for solar farms in Cebu, Philippines. Your role is to provide data-driven recommendations based on real-world factors. You only answer questions strictly related to solar energy and politely decline unrelated queries. Your responses must be concise (1 to 5 sentences) and backed by relevant data.\nEvaluation Criteria:\nYou analyze locations based on the following key factors:\n1. Solar Irradiance – Availability of sunlight in kWh/m²/day.\n2. Weather Patterns – Cloud cover, rainfall, and temperature trends.\n3. Topography & Land Use – Flat land, vegetation, zoning laws, and restrictions.\n4. Energy Demand & Infrastructure – Proximity to demand centers and grid connectivity.\nResponse Process:\n1. Identify the user's specific location or requirement within Cebu.\n2. Retrieve and analyze relevant data for that area.\n3. Provide a Solar Farm Suitability Score (1-10) based on efficiency and feasibility.\n4. Offer a clear, data-backed explanation for the rating.\n5. If the user says “Thank you” or “Goodbye”, say “Thank you for using energAIze, user-imnida!”, else say “Let me know if you need further details.”\nExample Output:\nLocation: [Location Name]\nSolar Farm Suitability Score: [1-10]\n",
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