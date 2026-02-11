import importlib
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient
from elasticsearch import NotFoundError


class ApproveActionContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch("elasticsearch.AsyncElasticsearch", return_value=MagicMock()):
            cls.main = importlib.import_module("backend.api_gateway.src.main")
        cls.app = cls.main.app

    def setUp(self):
        self.client = TestClient(self.app)

    def test_approve_action_success_contract(self):
        es_mock = AsyncMock()
        es_mock.get.return_value = {
            "_source": {
                "incident_id": "INC-123",
                "resolver_proposals": [
                    {"action_id": "ACT-1", "title": "Rollback", "requires_approval": True}
                ],
                "action_approvals": [],
            }
        }
        es_mock.update.return_value = {"result": "updated"}

        with patch.object(self.main, "es", es_mock):
            response = self.client.post(
                "/api/datapulse/v1/incidents/INC-123/actions/ACT-1/approve",
                headers={"x-user-id": "alice"},
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["incident_id"], "INC-123")
        self.assertEqual(body["action_id"], "ACT-1")
        self.assertEqual(body["status"], "approved")
        self.assertEqual(body["approved_by"], "alice")
        self.assertIn("timestamp", body)

    def test_approve_action_incident_not_found_contract(self):
        es_mock = AsyncMock()
        es_mock.get.side_effect = NotFoundError(message="missing", meta=None, body=None)

        with patch.object(self.main, "es", es_mock):
            response = self.client.post(
                "/api/datapulse/v1/incidents/INC-MISSING/actions/ACT-1/approve"
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Incident not found")

    def test_approve_action_action_not_found_contract(self):
        es_mock = AsyncMock()
        es_mock.get.return_value = {
            "_source": {
                "incident_id": "INC-123",
                "resolver_proposals": [{"action_id": "ACT-2", "title": "Scale up"}],
            }
        }

        with patch.object(self.main, "es", es_mock):
            response = self.client.post(
                "/api/datapulse/v1/incidents/INC-123/actions/ACT-1/approve"
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Action not found")


if __name__ == "__main__":
    unittest.main()
