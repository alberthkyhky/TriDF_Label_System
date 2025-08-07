import { useState } from "react";
import { TaskFormData } from "../../types/createTask";

export const defaultTaskFormData: TaskFormData = {
    title: '',
    description: '',
    instructions: '',
    example_media: [],
    questions_number: 100,
    priority: 'medium',
    required_agreements: 1,
    question_template: {
      question_text: 'What failures do you see in this data?',
      choices: {
        'A-type': {
          text: 'A-type failures (Structural)',
          options: ['None', 'A-Crack', 'A-Corrosion', 'A-Deformation', 'A-Missing part'],
          multiple_select: true
        },
        'B-type': {
          text: 'B-type failures (Functional)',
          options: ['None', 'B-Electrical', 'B-Mechanical', 'B-Software', 'B-Performance'],
          multiple_select: true
        },
        'C-type': {
          text: 'C-type failures (Quality)',
          options: ['None', 'C-Safety', 'C-Performance', 'C-Quality', 'C-Aesthetic'],
          multiple_select: true
        }
      }
    }
  };

export const useTaskFormData = () => {
    const [formData, setFormData] = useState<TaskFormData>({
      title: '',
      description: '',
      instructions: '',
      example_media: [],
      questions_number: 100,
      priority: 'medium',
      required_agreements: 1,
      question_template: {
        question_text: 'What failures do you see in this data?',
        choices: {
          'A-type': {
            text: 'A-type failures (Structural)',
            options: ['None', 'A-Crack', 'A-Corrosion', 'A-Deformation', 'A-Missing part'],
            multiple_select: true
          },
          'B-type': {
            text: 'B-type failures (Functional)',
            options: ['None', 'B-Electrical', 'B-Mechanical', 'B-Software', 'B-Performance'],
            multiple_select: true
          },
          'C-type': {
            text: 'C-type failures (Quality)',
            options: ['None', 'C-Safety', 'C-Performance', 'C-Quality', 'C-Aesthetic'],
            multiple_select: true
          }
        }
      }
    });
  
    return { formData, setFormData };
  };