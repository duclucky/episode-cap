"""Pinned SDK direct fixtures with a Windows stdin descriptor workaround."""
import os
import json
import sys
import tempfile
from pathlib import Path
import pytest
from gltest.direct import loader, sdk_loader
from gltest.direct.loader import deploy_contract
from gltest.direct.vm import VMContext

# Upstream direct adapter omits datetime and returns parsed JSON where the
# pinned SDK decoder requires JSON text. Keep the wire shape faithful to SDK.
_original_refresh = VMContext._refresh_gl_message


def refresh(vm):
    _original_refresh(vm)
    message = sys.modules.get("genlayer.message")
    if message is not None:
        message.raw["datetime"] = vm._datetime


VMContext._refresh_gl_message = refresh
from gltest.direct import wasi_mock


def llm_wire(vm, data):
    response = vm._match_llm_mock(data.get("prompt", ""))
    if response is None:
        raise wasi_mock.MockNotFoundError("No registered LLM response")
    return {"ok": response if isinstance(response, str) else json.dumps(response)}


wasi_mock._handle_llm_request = llm_wire

sdk_loader.CACHE_DIR = Path(__file__).resolve().parents[2] / ".genvm-direct-cache"
sdk_loader.BUNDLE_CACHE_DIR = sdk_loader.CACHE_DIR / "bundles-v2"
sdk_loader.TREE_CACHE_DIR = sdk_loader.CACHE_DIR / "trees-v2"

if os.name == "nt":
    original_cleanup = VMContext._cleanup_after_deactivate
    original_load = loader._load_module

    def inject(vm):
        from genlayer import calldata
        from genlayer.types import Address
        addr = lambda x: Address(x) if isinstance(x, bytes) else x
        encoded = calldata.encode({
            "contract_address": addr(vm._contract_address),
            "sender_address": addr(vm.sender), "origin_address": addr(vm.origin),
            "signer_address": addr(vm.origin), "stack": [], "value": vm._value,
            "datetime": vm._datetime, "is_init": False, "chain_id": vm._chain_id,
            "entry_kind": 0, "entry_data": b"", "entry_stage_data": None,
        })
        fd, filename = tempfile.mkstemp()
        try:
            os.write(fd, encoded)
            os.lseek(fd, 0, os.SEEK_SET)
            vm._original_stdin_fd = os.dup(0)
            os.dup2(fd, 0)
            vm._episode_stdin_file = filename
        finally:
            os.close(fd)

    def cleanup(vm):
        try:
            original_cleanup(vm)
        finally:
            filename = getattr(vm, "_episode_stdin_file", None)
            if filename:
                try:
                    os.unlink(filename)
                except FileNotFoundError:
                    pass
                vm._episode_stdin_file = None

    def load_module(path):
        import genlayer.contract as api
        api.__known_contract__ = None
        return original_load(path)

    loader._inject_message_to_fd0 = inject
    loader._load_module = load_module
    VMContext._cleanup_after_deactivate = cleanup


@pytest.fixture
def direct_deploy(direct_vm):
    def deploy(filename="contracts/episode_cap.py", *args):
        return deploy_contract(Path(filename).resolve(), direct_vm, *args, sdk_version="v0.6.0-rc5")
    return deploy
