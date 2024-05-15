const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

// Serve static files from the 'public' directory
// app.use(express.static('public'));
const corsOptions = {
  origin: "*", // List of allowed origins
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"], // List of allowed HTTP methods
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
  ], // List of allowed headers
  headers: "*",
  credentials: true,
};
app.use(express.json());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from all origins (for testing)
  next();
});

// Endpoint to handle requests from frontend

app.get("/", async (req, res) => {
  res.send("Server is running");
});

// app.post('/ask', async (req, res) => {
//     const prompt = req.body.prompt;
//     console.log(prompt)
//     const response = await askChatGPT(prompt);
//     res.send(response);
// });

// Function to interact with ChatGPT
app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt;
  console.log(prompt);
  const response = await askChatGPT(prompt);
  res.send(response);
  console.log(response);
});

// Function to interact with ChatGPT
async function askChatGPT(prompt) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-4-turbo",
    //   response_format: { type: "json_object" },
  });

  console.log(completion.choices[0]);
  return completion.choices[0];
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
