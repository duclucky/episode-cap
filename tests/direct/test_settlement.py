import copy
import sys
import pytest


@pytest.fixture
def module(direct_deploy):
    contract = direct_deploy()
    return sys.modules[contract.__class__.__module__]


def verdict(ids, relations):
    return {
        "events": [{"id": i, "support": "SUPPORTED"} for i in ids],
        "pairs": [{"a": ids[a], "b": ids[b], "relation": label} for a, b, label in relations],
        "reason": "Rationale is not financial authority.",
    }


def test_valid_shape_with_extra_event_cannot_reach_settlement(module):
    raw = verdict(["a", "b"], [(0, 1, "SAME_CAUSE")])
    raw["events"].append({"id": "forged", "support": "SUPPORTED"})
    with pytest.raises(Exception, match="event coverage"):
        module._normalize_result(raw, ["a", "b"])


def test_nontransitive_same_cause_cannot_swallow_explicit_separate_edge(module):
    raw = verdict(["a", "b", "c"], [(0, 1, "SAME_CAUSE"), (1, 2, "SAME_CAUSE"), (0, 2, "SEPARATE_CAUSES")])
    with pytest.raises(Exception, match="inconsistent causal partition"):
        module._normalize_result(raw, ["a", "b", "c"])


@pytest.mark.parametrize("corruption", ["missing_event", "duplicate_event", "invalid_support", "missing_pair", "extra_pair", "duplicate_pair", "invalid_relation", "reversed_pair"])
def test_full_entity_coverage_and_labels_are_settlement_requirements(module, corruption):
    raw = verdict(["a", "b"], [(0, 1, "SAME_CAUSE")])
    if corruption == "missing_event": raw["events"].pop()
    elif corruption == "duplicate_event": raw["events"][1]["id"] = "a"
    elif corruption == "invalid_support": raw["events"][0]["support"] = "PAY"
    elif corruption == "missing_pair": raw["pairs"].clear()
    elif corruption == "extra_pair": raw["pairs"].append({"a": "a", "b": "x", "relation": "SAME_CAUSE"})
    elif corruption == "duplicate_pair": raw["pairs"].append(copy.deepcopy(raw["pairs"][0]))
    elif corruption == "invalid_relation": raw["pairs"][0]["relation"] = "PAY"
    elif corruption == "reversed_pair": raw["pairs"][0].update(a="b", b="a")
    with pytest.raises(Exception):
        module._normalize_result(raw, ["a", "b"])


def test_equivalent_rationale_changes_never_change_partition(module):
    raw = verdict(["a", "b"], [(0, 1, "SAME_CAUSE")])
    other = copy.deepcopy(raw)
    other["reason"] = "A different explanation with the same causal meaning."
    a = module._normalize_result(raw, ["a", "b"])
    b = module._normalize_result(other, ["a", "b"])
    assert a == b
