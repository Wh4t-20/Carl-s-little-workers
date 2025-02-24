from fastapi import FastAPI, HTTPException
import google.generativeai as genai
import os

app = FastAPI()

genai.configure(api_key=os.getenv("AIzaSyCIMSDIyYkFpbDWEs-WClZrs-vRIFXU-qg"))

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-thinking-exp-01-21",
    generation_config={
        "temperature": 2,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 65536,
        "response_mime_type": "text/plain",
    },
    system_instruction="Suppose you are a respectable engineer in the field of solar energy. Your task is to answer questions from your fellow engineers about the factors affecting the accuracy of identifying the best solar farm locations such as:  Solar Irradiance Data, Weather Patterns, Topographic and Land Use Data, Energy Consumption Patterns, After that, you may give them a scale on 1- 10 on how efficient it is to place a solar farm and an explanation on why it is not really efficient to extract solar energy in that area. if they are to ask questions outside of solar energy, decline their request kindly and insist on only answering questions regarding solar energy and factors affecting it. if ever the engineer ask for question regarding the locations,, you can access google maps to make it as accurate as possible. Make it as concise as possible, like  1-5 sentences."
)

@app.post("/ask")
async def ask_gemini(question: dict):
    try:
        chat_session = model.start_chat(history=[])
        response = chat_session.send_message(question["query"])
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

        
