import ast
import sys
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / "contracts/episode_cap.py"


def test_exact_ascii_header_and_single_contract_class():
    source = SOURCE.read_text(encoding="utf-8")
    assert source.isascii()
    assert source.splitlines()[:3] == ["# v0.3.0", '# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }', "import genlayer as gl"]
    tree = ast.parse(source)
    classes = [node for node in tree.body if isinstance(node, ast.ClassDef) and any(ast.unparse(base) == "gl.contract.Contract" for base in node.bases)]
    assert [node.name for node in classes] == ["EpisodeCap"]
    contract = classes[0]
    methods = {node.name: node for node in contract.body if isinstance(node, ast.FunctionDef)}
    receiving = [name for name, node in methods.items() if "gl.message.value" in ast.unparse(node)]
    assert receiving == ["create_cover"]
    assert [ast.unparse(x) for x in methods["create_cover"].decorator_list] == ["gl.public.write.payable"]
    for name in ("ratify_cover", "review_cover", "expire_cover", "withdraw_credit", "close_cover"):
        assert [ast.unparse(x) for x in methods[name].decorator_list] == ["gl.public.write"]
    assert "gl.chain.Account" not in source
    assert "gl.vm.run_nondet_default(leader_fn, validator_fn)" in source
    for name in ("create_cover", "ratify_cover", "review_cover", "expire_cover"):
        assert "_now()" in ast.unparse(methods[name])
    for node in contract.body:
        if isinstance(node, ast.AnnAssign):
            assert ast.unparse(node.annotation) != "int"


def test_runtime_payability_metadata(direct_deploy):
    contract = direct_deploy()
    module = sys.modules[contract.__class__.__module__]
    import inspect
    metadata = dict(vars(module.EpisodeCap.create_cover))
    # SDK installs a public ABI marker; inspect it rather than mock a decorator.
    assert metadata
    assert "payable" in repr(metadata).lower()
