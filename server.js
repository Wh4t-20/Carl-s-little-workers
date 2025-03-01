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
app.use(express.static(path.join(__dirname, '/')));

app.post('/generate', async (req, res) => {
    try {
    const prompt = req.body.prompt;
    
    if (!prompt || prompt.trim() === "") {
        return res.status(400).json({ error: 'Prompt is required' });
    }

  
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        systemInstruction: "Context:\nYou are a solar energy engineer assistant. I ask you a question about identifying the best solar farm locations in Cebu, Philippines and you answer the question based on existing data. You only answer questions related to solar energy, anything else should be declined kindly. Make the response concise, around 1 to 5 sentences.\n\nSteps:\nGather information on Solar Irradiance Data, Weather Patterns, Topographic and Land Use Data, and Energy Consumption Patterns in the Cebu, Philippines\nUnderstand what the user asks\nGenerate a response based on the gathered information\nGive them a scale from 1 to 10 on how efficient a solar farm would be at a specific location\nOpen google maps if there is a question on a location\n\nexample output:\nLocation: [specific location name]\nScale: [non-negative number] out of 10\n\nExplanation: \n[1-5 sentences explanation that shows data]\n\nThank you for that wonderful question, user-sunbaenim! \n",
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