import { ref, watch } from "vue"
import { useKeyboard } from "@/composables/use-keyboard"
import { useBoard } from "@/composables/use-board"
import { type GameResult, GameStatus, type ValidKey } from "@/utils/types"
import { useWordle } from "./use-wordle"

export function useGame(wordLength = ref(5)) {
  const streak = ref(0)
  const savedLength = ref(wordLength.value)
  const { keyboard, updateKeyState, reset: resetKeyboard } = useKeyboard()
  const {
    word,
    numGuesses,
    availableLengths,
    isValid,
    isCorrect,
    getScore,
    getEvaluations,
  } = useWordle(wordLength)
  const boardDimensions = ref({
    width: wordLength.value,
    length: numGuesses.value,
  })
  const {
    board,
    currentRow,
    currentRowComplete,
    nextEmptyCell,
    nextUnevaluatedCell,
    inputtedWord,
    updateCell,
    clearLastCellWithLetter,
    reset: resetBoard,
  } = useBoard(boardDimensions)

  const result = ref<GameResult>()
  const gameOver = ref<boolean>(false)
  const cheated = ref<boolean>(false)
  const errors = ref<string[]>([])

  function handleBackspace() {
    clearLastCellWithLetter()
  }

  function handleSubmit() {
    if (currentRowComplete.value) {
      if (isValid(inputtedWord.value)) {
        evaluateInputtedWord(inputtedWord.value)
        currentRow.value++
      } else {
        errors.value.unshift("Not a valid word!")
      }
    } else {
      errors.value.unshift("Not enough letters in word!")
    }
  }

  function handleKeypress(key: ValidKey) {
    updateCell(nextEmptyCell.value, { value: key })
  }

  function reset() {
    if (!gameOver.value && currentRow.value === 0 && wordLength.value === savedLength.value) {
      return
    }
    boardDimensions.value = { width: wordLength.value, length: wordLength.value + 1 }
    savedLength.value = wordLength.value
    gameOver.value = false
    cheated.value = false
    result.value = undefined
    resetKeyboard()
    resetBoard()
  }

  function evaluateInputtedWord(input: string) {
    const index = nextUnevaluatedCell.value
    const evaluations = getEvaluations(input)
    evaluations.forEach((evaluation, letterIndex) => {
      updateCell(index + letterIndex, { state: evaluation })
      updateKeyState(input[letterIndex] as ValidKey, evaluation)
    })
    if (isCorrect(input)) {
      if (!cheated.value) {
        streak.value++
      }
      result.value = {
        status: GameStatus.WIN,
        word: word,
        streak: streak.value,
        guesses: currentRow.value + 1,
        score: getScore(currentRow.value),
        cheated: cheated.value,
      }
      gameOver.value = true
      return
    }
    if (currentRow.value === numGuesses.value - 1) {
      streak.value = 0
      result.value = {
        status: GameStatus.LOSS,
        streak: 0,
        word: word,
        guesses: currentRow.value + 1,
        score: 0,
        cheated: cheated.value,
      }
      gameOver.value = true
    }
  }

  watch(
    () => [...errors.value],
    (oldValue, newValue) => {
      if (oldValue.length < newValue.length) {
        return
      }
      const startIndex = currentRow.value * word.length
      const endIndex = startIndex + word.length
      for (let i = startIndex; i < endIndex; i++) {
        updateCell(i, { wiggle: true })
      }
      setTimeout(() => {
        errors.value.pop()
        for (let i = startIndex; i < endIndex; i++) {
          updateCell(i, { wiggle: false })
        }
      }, 2000)
    }
  )

  return {
    word,
    availableLengths,
    gameOver,
    result,
    cheated,
    errors,
    keyboard,
    board,
    handleBackspace,
    handleKeypress,
    handleSubmit,
    reset,
  }
}
