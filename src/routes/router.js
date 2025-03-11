import express from "express";

import { ChatInteractionHandler, GPTNonSessionChat } from "../controller/gptController.js";
import { CreateUser, GetAdminUser, GetUsers, UpdateUser } from "../controller/authController.js";
import { PixelGenerateCityImages } from "../controller/pixelController.js";
import { GenerateAIItenary } from "../controller/itenaryController.js";

const router = express.Router();

// --------- CHAT ----------- //
router.post('/chat', ChatInteractionHandler);
router.post('/ask', GPTNonSessionChat);

// --------- USERS ----------- //
router.get('/users', GetUsers);
router.post('/users', CreateUser);
router.patch('/users/:email', UpdateUser);
router.get('/users/admin/:email', GetAdminUser);

// --------- ITINERARY ----------- //
//router.get('/places', GetPlaces);
router.post('/generateAIItenerary', GenerateAIItenary);
// router.patch('/places/:id', UpdatePlace);
// router.delete('/places/:id', DeletePlace);

// --------- PIXELS IMAGES ----------- //
// router.get('/images', GetImages);
router.post('/generatePixelImages', PixelGenerateCityImages);
// router.patch('/images/:id', UpdateImage);
// router.delete('/images/:id', DeleteImage);

export default router;