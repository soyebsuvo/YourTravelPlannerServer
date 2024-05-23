const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const OpenAI = require("openai");

// asst_J1jsylicOUuL1ILcXLsXTGeH

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

// Serve static files from the 'public' directory
// app.use(express.static('public'));
// const corsOptions = {
//   origin: "*", // List of allowed origins
//   methods: ["GET", "POST", "DELETE", "PUT", "PATCH"], // List of allowed HTTP methods
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "Access-Control-Allow-Origin",
//   ], // List of allowed headers
//   headers: "*",
//   credentials: true,
// };

const corsConfig = {
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  // credentials: true,
  optionSuccessStatus: 200,
  "Access-Control-Allow-Origin" : "*"
};
app.use(cors(corsConfig));
app.use(express.json());
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*"); // Allow requests from all origins (for testing)
//   next();
// });

// Endpoint to handle requests from frontend

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k09zxzp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("PlacesDB");
    const continentsCollections = database.collection("Continents");
    const userdb = client.db("UsersDB");
    const usersCollection = userdb.collection("users");

    app.get("/api/places", async (req, res) => {
      const { query } = req.query;

      try {
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
          {
            params: {
              input: "dh",
              inputtype: "textquery",
              fields: "formatted_address,name,geometry",
              key: process.env.PLACES_API,
            },
          }
        );
        res.json(response.data);
        console.log(response.data);
      } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching places");
      }
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const exist = await usersCollection.findOne(query);
      if (exist) {
        return res.send({ message: "already have this user" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/api/continents", async (req, res) => {
      const continents = await continentsCollections
        .find({}, { projection: { continent: 1, _id: 0 } })
        .toArray();
      res.json(continents);
    });

    app.get("/api/countries/:continent", async (req, res) => {
      const continent = req.params.continent;
      const countries = await continentsCollections.findOne(
        { continent },
        { projection: { "countries.name": 1, _id: 0 } }
      );
      res.json(countries?.countries);
    });

    app.get("/api/cities/:continent/:country", async (req, res) => {
      const { continent, country } = req.params;
      const result = await continentsCollections.findOne(
        { continent, "countries.name": country },
        { projection: { "countries.$": 1, _id: 0 } }
      );
      res.json(result?.countries[0].cities);
    });

    // const main = async () => {
    // const assistant = await openai.beta.assistants.create({
    //   name: "Travel Planner",
    //   instructions:
    //     "You are a personal math tutor. Write and run code to answer math questions.",
    //   tools: [{ type: "code_interpreter" }],
    //   model: "gpt-4o",
    // });
    // };

    // main();

    // console.log(run)
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server is running");
});

const askAssistant = async (prompt) => {
  // const assistant = await openai.beta.assistants.create({
  //   name: "Travel Planner",
  //   instructions:
  //     "You are a personal math tutor. Write and run code to answer math questions.",
  //   tools: [{ type: "code_interpreter" }],
  //   model: "gpt-4o",
  // });
  const thread = await openai.beta.threads.create();
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });

  let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: process.env.ASSISTANTS_ID,
    instructions:
      "Please address the user as Jane Doe. The user has a premium account.",
  });

  // console.log("run" ,run)
  let responses = [];
  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    for (const message of messages.data.reverse()) {
      console.log(`${message.role} > ${message.content[0].text.value}`);
      responses.push(message.content[0].text.value);
      console.log("main", responses);
    }
  } else {
    console.log(run.status);
  }
  return responses[1];
};

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
  const cities = ["london", "paris", "rome"];
  const response = await askAssistant(prompt);
  // const imageResponse = await generateImages(cities);
  // console.log(imageResponse);
  const responses = { response: response };
  res.send(responses);
  console.log("heo", responses);
});

// Function to interact with ChatGPT
async function askChatGPT(prompt) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-4o",
    response_format: { type: "json_object" },
  });

  console.log(completion.choices[0]);
  return completion.choices[0];
}

const generateImages = async (cities) => {
  // Use Promise.all to wait for all async operations to complete
  const imageUrls = await Promise.all(
    cities.map(async (city) => {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Generate an image of ${city}`,
        n: 1,
        size: "1024x1024",
      });
      return response.data[0].url; // Return the image URL
    })
  );

  return imageUrls; // Return the array of image URLs
};

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
