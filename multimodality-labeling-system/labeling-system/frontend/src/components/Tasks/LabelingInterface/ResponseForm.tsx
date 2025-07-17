import React from 'react';
import { Grid } from '@mui/material';
import { QuestionDisplay } from './QuestionDisplay';

interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
}

interface QuestionWithMedia {
  id: string;
  task_id: string;
  question_text: string;
  question_order: number;
  status: string;
  target_classes: string[];
  media_files: any[];
  choices: {
    [key: string]: FailureChoice;
  };
  created_at: string;
  updated_at?: string;
}

interface QuestionResponse {
  question_id: string;
  task_id: string;
  responses: {
    [failureType: string]: string[];
  };
  started_at?: string;
}

interface ResponseFormProps {
  currentQuestion: QuestionWithMedia;
  currentResponse: QuestionResponse;
  onFailureTypeChange: (failureType: string, option: string, checked: boolean) => void;
  isResponseValid: () => boolean;
}

export const ResponseForm: React.FC<ResponseFormProps> = ({
  currentQuestion,
  currentResponse,
  onFailureTypeChange,
  isResponseValid
}) => {
  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <QuestionDisplay
        questionText={currentQuestion.question_text}
        questionId={currentQuestion.id}
        questionStatus={currentQuestion.status}
        choices={currentQuestion.choices}
        responses={currentResponse.responses}
        onSelectionChange={onFailureTypeChange}
        isResponseValid={isResponseValid()}
      />
    </Grid>
  );
};