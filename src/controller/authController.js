import { client } from "../database/MongoDB.js";

const getUserCollections = async () => {
    const usersDatabase = client.db("UsersDB");
    const usersCollection = usersDatabase.collection("users");
    return usersCollection;
}

export const GetUsers = async (req, res) => {
    try
    {
        const usersCollection = getUserCollections();
        const result = await usersCollection.find().toArray();
        res.send(result);    
    }
    catch (error) {
        res.status(500).send({ error : error, code : 500, message : "Error fetching users"});
    }
}

export const CreateUser = async (req, res) => {
    try
    {
        if(!req.body) {
            return res.status(400).send({ message: "Data is empty" });
        }

        const usersCollection = getUserCollections();

        const user = req.body;
        const query = { email: user?.email };

        if(!query || !query.email || !query.email.length > 2) {
            return res.status(400).send({ message: "Please Provide Email" });
        }

        const alreadyExist = await usersCollection.findOne(query);
        if (alreadyExist) {
          return res.send({ message: "already have this user" });
        }

        const result = await usersCollection.insertOne(user);
        return res.send(result);
    }
    catch (error) {
        return res.status(500).send({ error : error, code : 500, message : "Error creating user"});
    }
}

export const UpdateUser = async (req, res) => {
    try
    {
        const { phone } = req.query;
        const { email } = req.params;

        if (!phone || !email) {
            return res.status(400).send({
                code: 400,
                message: "Phone and email are required to update user."
            });
        }

        const filter = { email };
        const options = { upsert: true };
        const updateDoc = { $set: { phone } };

        const result = await usersCollection.updateOne(filter, updateDoc, options);

        return res.status(200).send({
            code: 200,
            message: "User updated successfully.",
            result
        })
    }
    catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).send({
            code: 500,
            message: "An error occurred while updating the user.",
            error: error.message
        })
    }
}

export const GetAdminUser = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).send({
                code: 400,
                message: "Email is required to get the user."
            })
        }

        const query = { email };
        const user = await usersCollection.findOne(query);

        if (!user) {
            return res.status(404).send({
                code: 404,
                message: "User not found."
            })
        }

        if (!user.role) {
            return res.status(200).send({ role: null });
        }

        if (user.role === "agent" || user.role === "admin") {
            return res.status(200).send({ role: user.role });
        }

        return res.status(403).send({
            code: 403,
            message: "Unauthorized access."
        })
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        return res.status(500).send({
            code: 500,
            message: "An error occurred while retrieving the user.",
            error: error.message
        })
    }
};
