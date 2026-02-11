import sys
import types
from pathlib import Path


class _FakeAsyncElasticsearch:
    def __init__(self, *args, **kwargs):
        pass


sys.modules.setdefault(
    "elasticsearch",
    types.SimpleNamespace(AsyncElasticsearch=_FakeAsyncElasticsearch),
)

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from agents.analyst.src import correlator


def test_extract_rcca_from_response_collects_tool_call_results():
    rounds = [
        {
            "round_number": 1,
            "steps": [
                {
                    "step_number": 1,
                    "type": "tool_call",
                    "tool_id": "esql",
                    "params": {"query": "FROM logs-*"},
                    "execution_time_ms": 147,
                    "results": [
                        {"data": {"error_rate": 0.42, "service": "checkout"}},
                        {"hits": [{"message": "timeout in downstream service"}]},
                    ],
                },
                {
                    "step_number": 2,
                    "type": "reasoning",
                    "reasoning": "Correlating spikes with dependency timeouts",
                },
            ],
        }
    ]

    rcca = correlator.extract_rcca_from_response(
        message="Root cause identified in dependency latency",
        confidence=0.92,
        rounds=rounds,
    )

    assert rcca["tool_calls_count"] == 1
    assert len(rcca["evidence"]) == 2

    first_evidence = rcca["evidence"][0]
    assert first_evidence["tool_id"] == "esql"
    assert first_evidence["execution_time_ms"] == 147
    assert first_evidence["type"] == "tool_result"

    max_len = correlator.RCCA_EVIDENCE_SNIPPET_MAX_CHARS
    for evidence_item in rcca["evidence"]:
        assert len(evidence_item["snippet"]) <= max_len + 3
