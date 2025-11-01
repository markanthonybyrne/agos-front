import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TutorialState {
  isActive: boolean
  currentStep: number
  completedSteps: number[]
  isTutorialCompleted: boolean
}

const getInitialState = (): TutorialState => {
  const tutorialCompleted = localStorage.getItem('tutorial_completed') === 'true'
  
  return {
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    isTutorialCompleted: tutorialCompleted,
  }
}

const initialState: TutorialState = getInitialState()

const tutorialSlice = createSlice({
  name: 'tutorial',
  initialState,
  reducers: {
    startTutorial: (state) => {
      state.isActive = true
      state.currentStep = 0
      state.completedSteps = []
    },
    nextStep: (state) => {
      if (!state.completedSteps.includes(state.currentStep)) {
        state.completedSteps.push(state.currentStep)
      }
      state.currentStep += 1
    },
    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1
      }
    },
    goToStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
    },
    skipTutorial: (state) => {
      state.isActive = false
      state.isTutorialCompleted = true
      localStorage.setItem('tutorial_completed', 'true')
    },
    completeTutorial: (state) => {
      state.isActive = false
      state.isTutorialCompleted = true
      if (!state.completedSteps.includes(state.currentStep)) {
        state.completedSteps.push(state.currentStep)
      }
      localStorage.setItem('tutorial_completed', 'true')
    },
    resetTutorial: (state) => {
      state.isActive = false
      state.currentStep = 0
      state.completedSteps = []
      state.isTutorialCompleted = false
      localStorage.removeItem('tutorial_completed')
    },
  },
})

export const {
  startTutorial,
  nextStep,
  previousStep,
  goToStep,
  skipTutorial,
  completeTutorial,
  resetTutorial,
} = tutorialSlice.actions

export default tutorialSlice.reducer

