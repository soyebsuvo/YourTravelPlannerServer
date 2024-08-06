/* jshint esversion: 8 */
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const OpenAI = require("openai");
// import { createClient } from 'pexels';
const { createClient } = require("pexels");

const pexels = createClient(process.env.PEXELS_API_KEY);
//

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
const openai2 = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY2 });

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

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json());
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*"); // Allow requests from all origins (for testing)
//   next();
// });

// Endpoint to handle requests from frontend

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // await client.connect();
    // client.connect();

    const database = client.db("PlacesDB");
    const continentsCollections = database.collection("Continents");
    const placesCollections = database.collection("Places");
    const userdb = client.db("UsersDB");
    const usersCollection = userdb.collection("users");
    const tripsdb = client.db("TripsDB");
    const savedCollections = tripsdb.collection("saved");
    const requestedCollections = tripsdb.collection("requested");

    // const generateImages = async (city) => {
    //   const query = `${city} city`;

    //   pexels.photos.search({ query, orientation : "portrait", per_page: 1 }).then((photos) => {
    //     console.log(photos.photos[0].src.original);
    //   });
    // };
    const generateImages = async (cities) => {
      const mainResults = await Promise.all(
        cities.map(async (city) => {
          const query = `${city} tour`;
          const photos = await pexels.photos.search({
            query,
            orientation: "portrait",
            per_page: 1,
          });
          return photos.photos[0].src.original;
        })
      );
      return mainResults;
    };
    // generateImages(['London', 'Paris', 'Tokyo', 'rome']).then(results => console.log(results));

    // app.get("/api/places", async (req, res) => {
    //   const { query } = req.query;

    //   try {
    //     const response = await axios.get(
    //       "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
    //       {
    //         params: {
    //           input: "dh",
    //           inputtype: "textquery",
    //           fields: "formatted_address,name,geometry",
    //           key: process.env.PLACES_API,
    //         },
    //       }
    //     );
    //     res.json(response.data);
    //     console.log(response.data);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).send("Error fetching places");
    //   }
    // });

    app.get("/users", async (req , res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

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

    app.patch("/users/:email", async (req, res) => {
      const phone = req.query.phone;
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          phone: phone,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      req.send(result);
    });

    app.get("/user/admin/:email", async (req, res) => {
      const email = req?.params?.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        if (!user?.role) {
          res.send({ role: null });
        } else if (user?.role === "agent") {
          res.send({ role: user?.role });
        } else if (user?.role === "admin") {
          res.send({ role: user?.role });
        } else {
          res.send({ message: "unauthorized access" });
        }
      } else {
        res.send({ message: "user not found" });
      }
    });

    app.get("/places", async (req, res) => {
      const places = await placesCollections.find().toArray();
      res.json(places);
    });

    app.get("/continents", async (req, res) => {
      const continents = await continentsCollections.find().toArray();
      res.json(continents);
    });

    app.get("/continent/:place", async (req, res) => {
      const place = req.params.place.toLowerCase();
      const allContinents = await continentsCollections.find().toArray();

      // Find the continent that contains the country or city matching the place
      const continent = allContinents.find(
        (cont) =>
          cont?.continent.toLowerCase().includes(place) ||
          cont?.countries?.some(
            (country) =>
              country.name.toLowerCase().includes(place) ||
              country.cities.some((city) => city.toLowerCase().includes(place))
          )
      );
      console.log(continent);

      if (continent) {
        res.json(continent);
      } else {
        res
          .status(404)
          .json({ error: "Continent not found for the given place" });
      }
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
        instructions: "Please remember the previous conversation of an user",
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
      try {
        const prompt = req.body.prompt;
        const cities = req.body.selectedCities;
        console.log("prompt : ", prompt);
        // const cities = ["london", "paris", "rome"];
        const response = await askAssistant(prompt);
        const imageResponse = await generateImages(cities);
        console.log("hahahaha", imageResponse);
        const responses = { response: response, imageResponse: imageResponse };
        res.send(responses);
        console.log("heo", responses);
      } catch (error) {
        console.log("Error from /ask", error);
      }
    });

    app.post("/chat", async (req, res) => {
      try {
        const text = req.body.text;
        console.log(text);
        const messageRes = await chatFunction(text);
        res.send(messageRes);
        console.log(messageRes);
      } catch (error) {
        console.log("Chat", error);
      }
    });

    const chatFunction = async (text) => {
      const completion = await openai2.chat.completions.create({
        messages: [{ role: "system", content: text }],
        model: "gpt-4o",
      });

      return completion.choices[0];
    };

    app.post("/saved", async (req, res) => {
      const itinerary = req.body;
      const result = await savedCollections.insertOne(itinerary);
      res.send(result);
    });

    app.post("/requested", async (req, res) => {
      const itinerary = req.body;
      const result = await requestedCollections.insertOne(itinerary);
      res.send(result);
    });

    app.patch("/saved/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          request: true,
        },
      };
      const result = await savedCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.patch("/requestedToAccept/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "accepted",
        },
      };
      const result = await requestedCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.patch("/requestedToReject/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "rejected",
        },
      };
      const result = await requestedCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/requested", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .send({ error: "Email query parameter is required" });
      }

      try {
        const query = { "traveller.email": email };
        const result = await requestedCollections.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching the data" });
      }
    });
    app.get("/requestedbids", async (req, res) => {
      try {
        const result = await requestedCollections.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching the data" });
      }
    });
    app.get("/requestedbyid", async (req, res) => {
      const id = req.query.id;
      if (!id) {
        return res.status(400).send({ error: "id is required" });
      }

      try {
        const query = { _id: new ObjectId(id) };
        let result = await requestedCollections.find(query).toArray();
        if(result?.length === 0){
          result = await savedCollections.find(query).toArray();
        }
        if (result.length === 0) {
          return res.status(404).send({ error: "Itinerary not found" });
        }
        console.log(result);
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching the data" });
      }
    });
    app.get("/saved", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .send({ error: "Email query parameter is required" });
      }

      try {
        const query = { "traveller.email": email };
        const result = await savedCollections.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching the data" });
      }
    });

    app.delete("/requested/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestedCollections.deleteOne(query);
      res.send(result);
    });
    app.delete("/saved/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await savedCollections.deleteOne(query);
      res.send(result);
    });

    // app.get("/isexist/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const isExist = await requestedCollections.findOne;
    // });

    // Function to interact with ChatGPT
    // async function askChatGPT(prompt) {
    //   const completion = await openai.chat.completions.create({
    //     messages: [{ role: "system", content: prompt }],
    //     model: "gpt-4o",
    //     response_format: { type: "json_object" },
    //   });

    //   console.log(completion.choices[0]);
    //   return completion.choices[0];
    // }

    // const generateImages = async (cities) => {
    //   // Use Promise.all to wait for all async operations to complete
    //   const imageUrls = await Promise.all(
    //     cities.map(async (city) => {
    //       const response = await openai.images.generate({
    //         model: "dall-e-3",
    //         prompt: `Generate an image of ${city}`,
    //         n: 1,
    //         size: "1024x1024",
    //       });
    //       return response.data[0].url; // Return the image URL
    //     })
    //   );

    //   return imageUrls; // Return the array of image URLs
    // };

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
    // await client.db("admin").command({ ping: 1 });
    // await client.db("admin").command({ ping: 1 });
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
