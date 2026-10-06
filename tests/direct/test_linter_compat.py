import ast
import importlib.util
from pathlib import Path


def checker(source):
    path = Path(__file__).resolve().parents[2] / "scripts/genvm_lint_rc.py"
    spec = importlib.util.spec_from_file_location("episode_lint", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    from genvm_linter.lint.structure import StorageClassChecker
    instance = StorageClassChecker()
    instance.visit(ast.parse(source))
    return instance.check_missing_decorators()


def storage_source(decorator):
    return f"{decorator}\nclass Record:\n    name: str\nclass Test(gl.contract.Contract):\n    records: TreeMap[str, Record]\n"


def test_current_storage_decorator_is_recognized():
    assert checker(storage_source("@gl.storage.allow")) == []


def test_undecorated_storage_class_still_rejected():
    assert any(item.code == "E014" for item in checker(storage_source("")))


def test_unrelated_decorator_cannot_bypass_storage_safety():
    assert any(item.code == "E014" for item in checker(storage_source("@gl.public.view")))
