import type { VercelRequest, VercelResponse } from "@vercel/node"
import clientPromise from "./_mongodb_client"
import dotenv from "dotenv"

if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const client = await clientPromise
  const db = client.db()
  const words = db.collection("words")

  const dbWords = await words.find({}).toArray()
  response.status(200).json(dbWords.map((x) => x.word))
}
