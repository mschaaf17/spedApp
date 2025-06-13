import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import { ApolloServer } from "apollo-server-express";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { typeDefs, resolvers } from "./schemas/index.js";
import { authMiddleware } from "./utils/auth.js";
import db from "./config/connection.js";

const PORT = process.env.PORT || 3001;
// create a new apollo server and pass in our schema data
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

app.post("/interventions", async (req, res) => {
  try {
    const prompt =
      req.body.prompt || "Write a one-sentence bedtime story about a unicorn.";

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.get("/generate-pdf", async (req, res) => {
  const { url } = req.query;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="studentData.pdf"',
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
});

// create a new instance of an Apollo server with the GraphQl schema
const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();
  // integrate our Apollo server witht he express application as middleware
  server.applyMiddleware({ app });

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      // log where we cna go to test our GQL API
      console.log(
        `Use GraphQl at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

// call the async function to start the server
startApolloServer(typeDefs, resolvers);
