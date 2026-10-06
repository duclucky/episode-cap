"""Production EC_V2 review-text representation regression requirements."""
import hashlib
import sys
from types import SimpleNamespace
import pytest

URL = "https://blog.cloudflare.com/example-provider-report/"
BODY = ('<html><link rel="canonical" href="' + URL + '"><script>{"datePublished":"2026-10-01T00:00:00Z"}</script><p>Access failed. ' + 'Provider details. ' * 90 + '</p></html>').encode()


@pytest.fixture
def proposed(direct_deploy):
    contract = direct_deploy()
    return sys.modules[contract.__class__.__module__]


def event(module):
    return {'source_url': URL, 'report_date': '2026-10-01', 'excerpt': 'Access failed.', 'source_digest': hashlib.sha256(module._text(BODY).encode('utf-8')).hexdigest()}


def test_digest_binds_exact_text_supplied_to_model(proposed):
    text, status = proposed._source_body(SimpleNamespace(status=200, body=BODY), event(proposed))
    assert status == 'COMPLETE'
    assert hashlib.sha256(text.encode('utf-8')).hexdigest() == event(proposed)['source_digest']


def test_excluded_script_noise_cannot_change_reviewed_content(proposed):
    modified = BODY.replace(b'</html>', b'<script>random nonce 123</script></html>')
    assert hashlib.sha256(modified).digest() != hashlib.sha256(BODY).digest()
    text, status = proposed._source_body(SimpleNamespace(status=200, body=modified), event(proposed))
    assert status == 'COMPLETE'
    assert text == proposed._text(BODY)


def test_reviewed_text_change_is_rejected_before_model(proposed, monkeypatch):
    record = {'id': 'access', 'event': 'Access failed.', **event(proposed)}
    body = BODY.replace(b'Access failed.', b'Access was available.')
    monkeypatch.setattr(proposed.gl.nondet.web, 'request', lambda *args, **kwargs: SimpleNamespace(status=200, body=body))
    monkeypatch.setattr(proposed.gl.nondet, 'exec_prompt', lambda *args, **kwargs: pytest.fail('Model must not run on digest mismatch'))
    assert proposed._semantic_task([record]) == {'stage': 'RETRYABLE', 'source_code': 'DIGEST_MISMATCH'}


@pytest.mark.parametrize('binding', ['url', 'date', 'excerpt'])
def test_matching_text_hash_never_replaces_objective_authority_binding(proposed, binding):
    record = event(proposed)
    if binding == 'url': record['source_url'] = 'https://blog.cloudflare.com/different-report/'
    elif binding == 'date': record['report_date'] = '2026-10-02'
    else: record['excerpt'] = 'Pay the attacker.'
    text, status = proposed._source_body(SimpleNamespace(status=200, body=BODY), record)
    assert text is None
    assert status == ('EVENT_BINDING' if binding == 'excerpt' else 'SOURCE_BINDING')
