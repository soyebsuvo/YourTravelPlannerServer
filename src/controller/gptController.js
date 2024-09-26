import session from "express-session";
import OpenAI from "openai";

//require('dotenv').config();
import { configDotenv } from "dotenv";
configDotenv({ path: './.env' });

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY, maxRetries : 3, timeout : 10000 });

function initializeConversationHistory(session) {
    if (!session.conversationHistory) {
        session.conversationHistory = [];
    }
}
export const ChatInteractionHandler = async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
        return res.status(400).json({ error: "Invalid message content" });
    }

    initializeConversationHistory(req.session);

    req.session.conversationHistory.push({ role: "user", content: userMessage });

    req.session.save((err) => {
        if (err) {
            console.error("Error saving session:", err);
        }
    });

    try
    {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: req.session.conversationHistory,
        });

        const response = completion.choices[0].message.content;

        if(response === typeof "string") { // save the chat only if its vaild
            req.session.conversationHistory.push({ role: "assistant", content: response });
        }
        res.json({ message: response });
    }
    catch (error) {
        console.error('Error communicating with OpenAI API:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const GPTNonSessionChat = async (req, res) => {
    const message = req.body.message;
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: "Invalid message content" });
    }

    try
    {
        const completion = await openai.chat.completions.create({
            model: "gpt-4", // pricing + performance consideration
            messages: [{ role: "user", content: message }],
        });

        const response = completion.choices[0].message.content;
        res.json({ message: response });
    }
    catch (error) {
        console.error('Error communicating with OpenAI API:', error.message);
        res.status(500).json({ error: error.message });
    }
}