import { Question, Task } from '../types/labeling';

export const fakeTask: Task = {
  id: "task-001",
  title: "Manufacturing Defect Detection",
  description: "Identify various types of failures in manufacturing data",
  instructions: "Compare the provided media items and identify any A-type, B-type, or C-type failures present.",
  example_media: ["example1.jpg", "example2.jpg"]
};

export const fakeQuestions: Question[] = [
  {
    id: "question-1",
    task_id: "task-001",
    question_text: "What failures do you see in this data?",
    media_files: ["batch1_image1.jpg", "batch1_image2.jpg", "batch1_video1.mp4"],
    choices: {
      "A-type": {
        text: "A-type failures (Structural)",
        options: ["None", "A-Crack", "A-Corrosion", "A-Deformation", "A-Missing part"],
        multiple_select: true
      },
      "B-type": {
        text: "B-type failures (Functional)",
        options: ["None", "B-Electrical", "B-Mechanical", "B-Software", "B-Performance"],
        multiple_select: true
      },
      "C-type": {
        text: "C-type failures (Quality)",
        options: ["None", "C-Safety", "C-Performance", "C-Quality", "C-Aesthetic"],
        multiple_select: true
      }
    }
  },
  {
    id: "question-2", 
    task_id: "task-001",
    question_text: "What failures do you see in this data?",
    media_files: ["batch2_image1.jpg", "batch2_image2.jpg"],
    choices: {
      "A-type": {
        text: "A-type failures (Structural)",
        options: ["None", "A-Crack", "A-Corrosion", "A-Deformation", "A-Missing part"],
        multiple_select: true
      },
      "B-type": {
        text: "B-type failures (Functional)", 
        options: ["None", "B-Electrical", "B-Mechanical", "B-Software", "B-Performance"],
        multiple_select: true
      },
      "C-type": {
        text: "C-type failures (Quality)",
        options: ["None", "C-Safety", "C-Performance", "C-Quality", "C-Aesthetic"],
        multiple_select: true
      }
    }
  },
  {
    id: "question-3",
    task_id: "task-001", 
    question_text: "What failures do you see in this data?",
    media_files: ["batch3_audio1.wav", "batch3_image1.jpg", "batch3_video1.mp4"],
    choices: {
      "A-type": {
        text: "A-type failures (Structural)",
        options: ["None", "A-Crack", "A-Corrosion", "A-Deformation", "A-Missing part"],
        multiple_select: true
      },
      "B-type": {
        text: "B-type failures (Functional)",
        options: ["None", "B-Electrical", "B-Mechanical", "B-Software", "B-Performance"], 
        multiple_select: true
      },
      "C-type": {
        text: "C-type failures (Quality)",
        options: ["None", "C-Safety", "C-Performance", "C-Quality", "C-Aesthetic"],
        multiple_select: true
      }
    }
  }
];

export const getFakeTask = (taskId: string): Task | null => {
  return fakeTask.id === taskId ? fakeTask : null;
};

export const getFakeQuestions = (taskId: string): Question[] => {
  return fakeQuestions.filter(q => q.task_id === taskId);
};