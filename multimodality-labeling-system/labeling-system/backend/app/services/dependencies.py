# app/api/dependencies.py
"""
Dependency injection for FastAPI routes
"""
from app.services import (
    media_service, task_service,
    assignment_service, question_service, response_service
)


def get_media_service():
    return media_service

def get_task_service():
    return task_service

def get_assignment_service():
    return assignment_service

def get_question_service():
    return question_service

def get_response_service():
    return response_service