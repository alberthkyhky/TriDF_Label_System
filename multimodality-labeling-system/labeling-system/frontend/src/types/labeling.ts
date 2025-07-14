export interface Question {
    id: string;
    task_id: string;
    question_text: string;
    media_files: string[];
    choices: {
      [key: string]: {
        text: string;
        options: string[];
        multiple_select: boolean;
      }
    };
  }
  
export interface QuestionResponse {
question_id: string;
task_id: string;
responses: {
    [failureType: string]: string[];
};
media_files: string[];
}

export interface Task {
id: string;
title: string;
description: string;
instructions: string;
example_media?: string[];
}