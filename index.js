const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const uri = process.env.MONGODB_URI;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("pet-place");
    const petsCollection = db.collection("all_pets");
    const requestsCollection = db.collection("requests");

    app.post("/all_pets", async (req, res) => {
      const petData = req.body;
      // console.log("data received", desData);

      const result = await petsCollection.insertOne(petData);
      res.json(result);
    });

    app.get("/all_pets", async (req, res) => {
      const result = await petsCollection.find().sort({ _id: -1 }).toArray();
      res.json(result);
    });

    app.get("/all_pets/:id", async (req, res) => {
      const { id } = req.params;
      const result = await petsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.get("/my_listing/:email", async (req, res) => {
      const { email } = req.params;
      const result = await petsCollection
        .find({ ownerEmail: email })
        .sort({ _id: -1 })
        .toArray();
      res.json(result);
    });

    //delete a pet using email
    app.delete("/all_pets/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;

      const pet = await petsCollection.findOne({ _id: new ObjectId(id) });

      if (!pet) return res.status(404).json({ message: "Pet not found" });
      if (pet.ownerEmail !== email)
        return res.status(403).json({ message: "Unauthorized" });

      const result = await petsCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    app.patch("/all_pets/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      // console.log(updateData);
      const result = await petsCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updateData,
        },
      );
      res.json(result);
    });

    app.post("/requests", async (req, res) => {
      const request = req.body;
      const result = await requestsCollection.insertOne(request);
      res.json(result);
    });
    //find request via email
    app.get("/requests/:email", async (req, res) => {
      const email = decodeURIComponent(req.params.email);
      const result = await requestsCollection
        .find({ adopterEmail: email })
        .sort({ _id: -1 })
        .toArray();
      res.json(result);
    });

    // check if a user already requested a specific pet
    app.get("/requests/check/:petId/:email", async (req, res) => {
      const { petId, email } = req.params;
      const existing = await requestsCollection.findOne({
        petId,
        adopterEmail: decodeURIComponent(email),
      });
      res.json({ exists: !!existing, status: existing?.status || null });
    });

    // get requests for a specific pet — owner sees who requested
    app.get("/requests/pet/:petId", async (req, res) => {
      const { petId } = req.params;
      const result = await requestsCollection
        .find({ petId })
        .sort({ _id: -1 })
        .toArray();
      res.json(result);
    });
    
    // owner approves or rejects a request
    app.patch("/requests/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body; 
      const result = await requestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } },
      );
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("pet place server is working fine");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
