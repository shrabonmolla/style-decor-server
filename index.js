const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
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
    const bookingsColl = db.collection("bookings");

    // services related apis

    // GET-ID -- getting single services
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesColl.findOne(query);
      res.send(result);
    });

    // GET -- getting all servies data
    app.get("/services", async (req, res) => {
      const cursor = servicesColl.find().sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    //  POST -- creating a servies
    app.post("/services", async (req, res) => {
      const servicesData = req.body;
      servicesData.createdAt = new Date();
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

    // bookings services related apis

    // GET-- getting bookings data
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const cursor = bookingsColl.find({ email: email });
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST-- adding booking info to database
    app.post("/bookings", async (req, res) => {
      const bookingsData = req.body;
      const result = await bookingsColl.insertOne(bookingsData);
      res.send(result);
    });

    // Payments  related apis

    // getting payment link
    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      const amount = parseInt(paymentInfo.serviceCost);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: `kire sala teka de ${paymentInfo.serviceName}`,
              },
            },

            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          serviceId: paymentInfo.serviceId,
          customerName: paymentInfo.customerName,
        },
        customer_email: paymentInfo.customerEmail,
        success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment_success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment_cancell`,
      });
      res.send({ url: session.url });
    });

    // updating booking info after payment successful
    app.patch("/payment-success", async (req, res) => {
      const sessionId = req.query.sessionId;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(session);
      if (session.payment_status === "paid") {
        const id = session.metadata.serviceId;
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            paymentStatus: session.payment_status,
          },
        };
        const result = await bookingsColl.updateOne(query, update);
        res.send(result);
      }
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
