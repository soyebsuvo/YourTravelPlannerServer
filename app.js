import express from "express";
import session from "express-session";
import crypto from "crypto";
import { configDotenv } from "dotenv";
configDotenv();

import router from './src/routes/router.js';

const app = express();
const port = 3000;

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(8).toString('binary'),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(express.json());
app.use('/', router);


app.listen(port, () => {
    console.log(`Chatbot server is running at http://localhost:${port}`);
});
