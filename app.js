import express from "express";
import session from "express-session";
import crypto from "crypto";
import cors from "cors";
import { configDotenv } from "dotenv";
configDotenv();

import router from './src/routes/router.js';

const allowedOrigins = ["*", "http://localhost:5173"];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
};

const app = express();
const port = 3000;

app.use(cors(corsOptions));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(8).toString('binary'),
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge : 120000, // MS,
        sameSite: 'lax'
    }
}));

app.use(express.json());
app.use('/', router);


app.listen(port, () => {
    console.log(`Chatbot server is running at http://localhost:${port}`);
});
