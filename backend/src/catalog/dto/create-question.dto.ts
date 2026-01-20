export type CreateQuestionDto = {
  text: string;
  imageUrl?: string;
  moduleId?: number;
  answers: Array<{
    text: string;
    correct?: boolean;
  }>;
};
