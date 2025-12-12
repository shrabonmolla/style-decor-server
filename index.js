const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT;
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  SeverityLevel,
} = require("mongodb");
const uri = process.env.MONGODB_URI;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("O amai valobaseniiiiiiiiiiiiiiii");
});

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
    const db = client.db("StyleDecor");
    const servicesColl = db.collection("services");

    //  app.post("/services", async(req,res) => {

    //     })

    // GET-ID -- getting single services
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesColl.findOne(query);
      res.send(result);
    });

    // GET -- getting all servies data
    app.get("/services", async (req, res) => {
      const cursor = servicesColl.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //  POST -- creating a servies
    app.post("/services", async (req, res) => {
      const servicesData = req.body;
      const result = await servicesColl.insertOne(servicesData);
      res.send(result);
    });

    // DELETE -- deleting a service
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesColl.deleteOne(query);
      res.send(result);
    });

    // PATCH -- updating a services
    app.patch("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedService = {
        $set: {
          serviceName: req.body.serviceName,
          serviceCategory: req.body.serviceCategory,
          serviceDescription: req.body.serviceDescription,
          serviceCost: req.body.serviceCost,
          unit: req.body.unit,
          createdBy: req.body.createdBy,
        },
      };
      const result = await servicesColl.updateOne(query, updatedService);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("kire sala ping koro keno");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Style decor app listening on port ${port}`);
});
