import os
import glob
import random
from typing import List, Union

class LocalDataSampler:
    def __init__(self, task_name: str):
        self.task_name = task_name

    def sample_by_idx(self, idx: Union[int, List[int]]) -> List[str]:
        if isinstance(idx, int):
            idx = [idx]
        sampled = []
        
        return ["./uploads/videos/sample-5s.mp4"]
