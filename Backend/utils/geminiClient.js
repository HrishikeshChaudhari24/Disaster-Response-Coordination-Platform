const { GoogleGenerativeAI } = require("@google/generative-ai");
// require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are a disaster image analyst. You detect whether images are real or manipulated and identify disaster types if present."
  });

  const generateWithGemini = async (prompt) => {
    try {
      const result = await model.generateContent([{
        text: prompt
      }]);
  
      const text = result.response.text();
  
      // Extract JSON from markdown block if present
      const jsonMatch = text.match(/```json([\s\S]*?)```/i);
      const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
  
      return JSON.parse(cleanText);
    } catch (err) {
      console.error("❌ generateWithGemini error:", err);
      return [];
    }
  };
  
  module.exports = {
    model,
    generateWithGemini
  };