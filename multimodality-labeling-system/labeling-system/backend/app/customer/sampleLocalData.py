import os
import glob
import random
from typing import List, Union

class LocalDataSampler:
    def __init__(self, root: str, subfolder: str):
        self.root = root
        self.subfolder = subfolder
        pattern = os.path.join(self.root, self.subfolder, '*')
        self.paths = sorted(glob.glob(pattern))
        if not self.paths:
            raise ValueError(f"No files found in {pattern}")

    def sample_by_idx(self, idx: Union[int, List[int]]) -> List[str]:
        if isinstance(idx, int):
            idx = [idx]
        sampled = []
        for i in idx:
            if i < 0 or i >= len(self.paths):
                raise IndexError(f"Index {i} is out of range (0 to {len(self.paths)-1})")
            sampled.append(self.paths[i])
        return ["/Users/yangping/Studio/side-project/ICLR2026_MMID/multimodality-labeling-system/labeling-system/backend/uploads/videos/sample-5s.mp4"]
        # return sampled
