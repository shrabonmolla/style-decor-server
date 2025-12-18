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
    const paymentsColl = db.collection("payments");
    const userColl = db.collection("users");

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

    app.get("/payments", async (req, res) => {
      const email = req.query.email;
      const query = {};

      if (email) {
        query.customerEmail = email;
      }

      const cursor = paymentsColl.find(query).sort({ paidAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      const amount = parseInt(paymentInfo.serviceCost) * 100;
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
          serviceName: paymentInfo.serviceName,
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
      const transactionId = session.payment_intent;
      const query = { transactionId: transactionId };
      const paymentExist = await paymentsColl.findOne(query);
      if (paymentExist) {
        return res.send({ messsage: "payment already exist" });
      }
      // console.log(session);
      if (session.payment_status === "paid") {
        const id = session.metadata.serviceId;
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            paymentStatus: session.payment_status,
          },
        };
        const result = await bookingsColl.updateOne(query, update);

        const payment = {
          serviceName: session.metadata.serviceName,
          serviceId: session.metadata.serviceId,
          customerName: session.metadata.customerName,
          customerEmail: session.customer_email,
          amount: session.amount_total / 100,
          transactionId: session.payment_intent,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
        };

        const paymentResult = await paymentsColl.insertOne(payment);

        res.send({
          updatedBookingInfo: result,
          paymentInfo: paymentResult,
        });
      }
    });

    // USER RELATED APIS
    // saving user in the db
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.createdAt = new Date();

      const email = user.email;
      const userExists = await userColl.findOne({ email });

      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await userColl.insertOne(user);
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
