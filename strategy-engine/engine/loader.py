import importlib
import os
from pathlib import Path

class StrategyLoader:
    """Dynamically loads strategy classes."""
    
    def __init__(self):
        self._strategies_dir = Path(__file__).parent.parent / "strategies"
        self._user_dir = Path(__file__).parent.parent / "user_strategies"
        self._cache: dict = {}
    
    def load_strategy(self, name: str):
        """Load a strategy class by name."""
        if name in self._cache:
            return self._cache[name]
        
        for directory in [self._strategies_dir, self._user_dir]:
            module_path = directory / f"{name}.py"
            if module_path.exists():
                spec = importlib.util.spec_from_file_location(name, str(module_path))
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if isinstance(attr, type) and attr_name.endswith("Strategy") and attr_name != "BaseStrategy":
                        self._cache[name] = attr
                        return attr
        raise ValueError(f"Strategy '{name}' not found")
    
    def list_strategies(self) -> list[str]:
        """List available strategy names."""
        names = []
        for directory in [self._strategies_dir, self._user_dir]:
            if directory.exists():
                for f in directory.glob("*.py"):
                    if f.name != "__init__.py" and f.name != "base.py":
                        names.append(f.stem)
        return names
