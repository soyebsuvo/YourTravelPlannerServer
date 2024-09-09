import express from "express";
import { ChatInteractionHandler } from "../controller/gptController.js";

const router = express.Router();

router.post('/chat', ChatInteractionHandler);

export default router;