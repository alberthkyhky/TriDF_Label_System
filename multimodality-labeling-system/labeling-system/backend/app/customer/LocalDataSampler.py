import os
import csv
from typing import List, Union, Dict


class LocalDataSampler:
    def __init__(self, root: str):
        """
        Initialize sampler with a root directory that will prefix all paths.
        """
        self.root = root
        self.data_by_task: Dict[str, List[dict]] = {}

    def load_csv(self, task_name: str, csv_path: str):
        """
        Load a single task CSV file and map rows by index.
        """
        if task_name not in self.data_by_task:
            self.data_by_task[task_name] = []

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.data_by_task[task_name].append(row)

        if not self.data_by_task[task_name]:
            raise ValueError(f"No data loaded for task_name: {task_name}")

    def sample_by_idx(self, task_name: str, idx: Union[int, List[int]]) -> List[dict]:
        """
        Sample full rows (with absolute paths) by task_name and index or list of indices.
        Returns:
            A list of full row dicts with output_wav and other_wav prefixed with root.
        """
        if task_name not in self.data_by_task:
            raise ValueError(f"No data loaded for task_name: {task_name}")

        if idx < len(self.data_by_task[task_name]):
            row = self.data_by_task[task_name][idx]
            # Prefix paths with root directory
            row["output_wav"] = os.path.join(self.root, task_name, row["output_wav"])
            row["other_wav"] = os.path.join(self.root, task_name, row["other_wav"])
            return row
        else:
            raise IndexError(f"Index {idx} exceeds the number of rows in task_name {task_name}")

root="/Users/yangping/Studio/side-project/ICLR2026_MMID/multimodality-labeling-system/labeling-system/backend/taskData"
sampler = LocalDataSampler(root)

csv_file = "/Users/yangping/Studio/side-project/ICLR2026_MMID/multimodality-labeling-system/labeling-system/backend/taskData/aud_voice_cloning/collect.csv"
sampler.load_csv("aud_voice_cloning", csv_file)

# print(sampler.sample_by_idx("aud_voice_cloning", 0))
