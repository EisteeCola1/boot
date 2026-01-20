export interface Module {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  category: "see" | "binnen"
  display_order: number
  created_at: string
}

export interface Question {
  id: string
  module_id: string
  question_number: number
  question_text: string
  image_url: string | null
  created_at: string
}

export interface AnswerOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  display_order: number
  created_at: string
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  selected_option_id: string
  is_correct: boolean
  answered_at: string
}

export interface BookmarkedQuestion {
  id: string
  user_id: string
  question_id: string
  created_at: string
}

export interface QuestionWithAnswers extends Question {
  answer_options: AnswerOption[]
}

export interface ModuleProgress {
  total: number
  answered: number
  correct: number
  incorrect: number
  bookmarked: number
  percentage: number
}
