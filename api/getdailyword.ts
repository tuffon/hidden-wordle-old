import type { VercelRequest, VercelResponse } from "@vercel/node"
import clientPromise from "./_mongodb_client"
import dotenv from "dotenv"

if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}

async function setWordsUnused(words) {
  await words.updateMany({}, { $set: { used: false, current: false } })
}

async function setQuotesUnused(quotes, ids = null) {
  if (ids == null) {
    await quotes.updateMany({}, { $set: { used: false, current: false } })
  } else {
    await quotes.updateMany({ id: { $in: ids } }, { $set: { used: false, current: false } })
  }
}

async function chooseNewWordAndQuote(quotes, words) {
  // get time at start of current 24 hours
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  // choose a word
  let availableWords = await words.find({ used: false, length: 5 }).toArray()
  if (availableWords.length == 0) {
    // if all words have been used, set all quotes and words to unused
    await setWordsUnused(words)
    await setQuotesUnused(quotes)
    availableWords = await words.find({ used: false, length: 5 }).toArray()
  }
  const chosenIdx = Math.floor(Math.random() * availableWords.length)

  // choose a quote
  let availableQuotes = await quotes.find({ used: false, id: { $in: availableWords[chosenIdx].quote_ids } }).toArray()
  if (availableQuotes.length == 0) {
    // if all quotes for this word have been used, set all of those quotes to unused
    await setQuotesUnused(quotes, availableWords[chosenIdx].quote_ids)
    availableQuotes = await quotes.find({ used: false, id: { $in: availableWords[chosenIdx].quote_ids } }).toArray()
  }
  const quoteIdx = Math.floor(Math.random() * availableQuotes.length)

  // set the word as chosen
  await words.updateOne(
    { id: availableWords[chosenIdx].id },
    {
      $set: { current: true, selectedDate: start },
    }
  )

  // set the quote as chosen
  await quotes.updateOne(
    { id: availableQuotes[quoteIdx].id },
    {
      $set: { current: true },
    }
  )

  return [availableWords[chosenIdx].word, availableQuotes[quoteIdx].quote]
}

async function removeCurrentWordAndQuote(quotes, words) {
  await words.updateMany({ current: true }, { $set: { used: true, current: false } })
  await quotes.updateMany({ current: true }, { $set: { used: true, current: false } })
}

function hasADayPassed(timestamp) {
  const now = new Date()

  const msBetweenDates = Math.abs(timestamp.getTime() - now.getTime())

  // 👇️ convert ms to hours                  min  sec   ms
  const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000)

  return hoursBetweenDates > 24
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const client = await clientPromise
  const db = client.db()
  const quotes = db.collection("quotes")
  const words = db.collection("words")

  // await removeCurrentWordAndQuote(quotes, words)
  // response.status(200).json({})
  // return

  // get the current word and quote of the day
  const currentWords = await words.find({ current: true }).toArray()

  let currentWord, currentQuote
  // check if the current word and quote of the day needs to be updated. if so, do it
  if (currentWords.length == 0) {
    ;[currentWord, currentQuote] = await chooseNewWordAndQuote(quotes, words)
  } else if (currentWords.length == 1) {
    // check if 24 hours has passed since the word
    const selectedDate = new Date(currentWords[0].selectedDate)

    if (hasADayPassed(selectedDate)) {
      await removeCurrentWordAndQuote(quotes, words)
      ;[currentWord, currentQuote] = await chooseNewWordAndQuote(quotes, words)
    } else {
      currentWord = currentWords[0].word
      currentQuote = (await quotes.findOne({ current: true })).quote
    }
  } else {
    // resolve the error case where there's more than 1 current word by removing all of them and choosing a new one
    // TODO temp solution, think of more elegant resolution
    await removeCurrentWordAndQuote(quotes, words)
    ;[currentWord, currentQuote] = await chooseNewWordAndQuote(quotes, words)
  }

  // return the word and the quote
  response.status(200).json({ current_word: currentWord, current_quote: currentQuote })
}
