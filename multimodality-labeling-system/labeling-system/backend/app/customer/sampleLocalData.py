import os
import glob
import random
from typing import List, Union

class LocalDataSampler:
    def __init__(self, root: str):
        self.root = root
        pattern = os.path.join(self.root, '*')
        self.paths = sorted(glob.glob(pattern))
        if not self.paths:
            raise ValueError(f"No files found in {pattern}")

    def sample_by_idx(self, idx: Union[int, List[int]]) -> List[str]:
        if isinstance(idx, int):
            idx = [idx]
        sampled = []
        return ["/Users/yangping/Studio/side-project/ICLR2026_MMID/multimodality-labeling-system/labeling-system/backend/uploads/videos/sample-5s.mp4"]
        # return sampled
