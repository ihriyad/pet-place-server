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

    app.post("/all_pets", async (req, res) => {
      const petData = req.body;
      // console.log("data received", desData);

      const result = await petsCollection.insertOne(petData);
      res.json(result);
    });

    app.get("/all_pets", async (req, res) => {
      const result = await petsCollection.find().toArray();
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
      const result = await petsCollection.find({ ownerEmail: email }).toArray();
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
