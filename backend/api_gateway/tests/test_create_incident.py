import pathlib
import sys
import types
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient


class _FakeAsyncElasticsearch:
    def __init__(self, hosts=None):
        self.hosts = hosts or []

    async def index(self, *args, **kwargs):
        return {"result": "created"}


sys.modules.setdefault(
    "elasticsearch",
    types.SimpleNamespace(AsyncElasticsearch=_FakeAsyncElasticsearch),
)

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1] / "src"))
import main  # noqa: E402


class CreateIncidentFailureContractTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_returns_non_201_when_elasticsearch_write_fails(self):
        payload = {
            "source": "sentinel",
            "service": "payments",
            "detected_at": "2026-01-01T00:00:00Z",
            "severity": "critical",
            "metrics": {"error_rate": 0.42, "p99_latency_ms": 1200},
            "evidence": [{"type": "log", "text": "upstream timeout"}],
            "correlation_id": "corr-12345",
        }

        with patch.object(main.es, "index", AsyncMock(side_effect=RuntimeError("ES down")), create=True) as mocked_index, \
             patch.object(main, "notify_integrations", AsyncMock()) as mocked_notify, \
             patch.object(main, "trigger_analyst", AsyncMock()) as mocked_trigger:
            response = self.client.post("/api/datapulse/v1/incidents", json=payload)

        self.assertEqual(mocked_index.await_count, 1)
        self.assertEqual(response.status_code, 503)

        body = response.json()
        self.assertIn("detail", body)
        self.assertEqual(body["detail"]["code"], "INCIDENT_PERSISTENCE_FAILED")
        self.assertEqual(body["detail"]["correlation_id"], payload["correlation_id"])
        self.assertEqual(body["detail"]["index"], main.INDEX_INCIDENTS)
        self.assertTrue(body["detail"]["incident_id"].startswith("INC-"))

        mocked_notify.assert_not_awaited()
        mocked_trigger.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
