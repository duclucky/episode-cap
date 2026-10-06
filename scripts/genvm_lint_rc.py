"""Recognize verified v0.3 spellings; preserve all upstream safety checks."""
from genvm_linter.lint import safety, structure
safety.SafeEntryPointFinder.SAFE_PATTERNS["gl.vm.run_nondet_default"] = [0, 1]
safety.NONDET_SPAWN_CALLS = safety.NONDET_SPAWN_CALLS | {"gl.vm.run_nondet_default"}
_original_visit = structure.StorageClassChecker.visit_ClassDef


def _visit_current_storage(self, node):
    if any(self._decorator_to_string(dec) == "gl.storage.allow" for dec in node.decorator_list):
        self.allow_storage_classes.add(node.name)
    _original_visit(self, node)


structure.StorageClassChecker.visit_ClassDef = _visit_current_storage
from genvm_linter.cli import main
if __name__ == "__main__":
    main()
