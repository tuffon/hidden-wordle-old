import axios from 'axios'
import { EvaluationState, ApiResult } from "@/utils/types"
import { computed, ref } from "vue"
import {
  english10,
  english20,
  english35,
  english40,
  canadian10,
  canadian20,
  canadian35,
  canadian40,
  american10,
  american20,
  american35,
  american40,
} from "wordlist-js"

const allWords = [
  ...english10,
  ...english20,
  ...english35,
  ...english40,
  ...canadian10,
  ...canadian20,
  ...canadian35,
  ...canadian40,
  ...american10,
  ...american20,
  ...american35,
  ...american40,
]
const uniqueWords = [...new Set(allWords)].map((w) => w.toUpperCase())

function getData(): ApiResult {
  let data
  axios.get('/api/getdailyword').then((res) => {
    data = res.data
  })
  return data || { current_word: "test", current_quote: "blastoff" }
}

function getValidWords(length: number) {
  const filteredWords = uniqueWords.filter((w) => w.length === length)
  return filteredWords
}

export function useWordle(length = ref(5)) {
  const availableLengths = [3, 4, 5, 6, 7, 8]
  const validWords = ref(getValidWords(length.value))
  const data = getData()
  const word = data?.current_word
  const quote = data?.current_quote

  const numGuesses = computed(() => {
    return word.length + 1
  })

  function isValid(w: string) {
    return validWords.value.includes(w)
  }

  function isCorrect(w: string) {
    return w === word
  }

  function getScore(guessesMade: number) {
    return 100 - (100 / (numGuesses.value - 1)) * guessesMade
  }

  function getEvaluations(inputWord: string): EvaluationState[] {
    const inputArray = inputWord.split("")
    const wordArray = word.split("")
    const evaluations: EvaluationState[] = []
    inputArray.forEach((letter, lIndex) => {
      let evaluation = EvaluationState.UNKNOWN
      if (letter === wordArray[lIndex]) {
        evaluation = EvaluationState.CORRECT
        const multiple = wordArray.filter((v) => v === letter)
        if (multiple.length > 1) {
          const [multipleLetter] = multiple
          const guess = inputArray.filter((v) => v === multipleLetter)
          if (guess.length < multiple.length) {
            const [guessLetter] = guess
            inputArray.forEach((letter) => {
              if (letter === guessLetter) {
                evaluation = EvaluationState.MULTIPLE
              }
            })
          }
        }
      } else if (wordArray.includes(letter)) {
        evaluation = EvaluationState.PRESENT
      } else {
        evaluation = EvaluationState.ABSENT
      }
      evaluations.push(evaluation)
    })
    return evaluations
  }

  return {
    length,
    word,
    numGuesses,
    availableLengths,
    isValid,
    isCorrect,
    getScore,
    getEvaluations,
  }
}
