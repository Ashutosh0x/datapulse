import hashlib
import hmac
import os
import sys
import types
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

elasticsearch_stub = types.ModuleType("elasticsearch")


class DummyAsyncElasticsearch:
    def __init__(self, *args, **kwargs):
        pass


elasticsearch_stub.AsyncElasticsearch = DummyAsyncElasticsearch
sys.modules.setdefault("elasticsearch", elasticsearch_stub)

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from main import verify_slack_signature


class TestSlackSignatureVerification(unittest.TestCase):
    def _sign(self, secret: str, timestamp: str, body: bytes) -> str:
        sig_basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
        req_hash = hmac.new(
            secret.encode("utf-8"),
            sig_basestring.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return f"v0={req_hash}"

    def test_valid_signature(self):
        body = b"payload=test"
        timestamp = str(int(datetime.now().timestamp()))
        secret = "my-secret"
        signature = self._sign(secret, timestamp, body)

        with patch.dict(
            os.environ,
            {
                "SLACK_SIGNING_SECRET": secret,
                "ENVIRONMENT": "production",
                "ALLOW_INSECURE_SLACK_WEBHOOK": "false",
            },
            clear=False,
        ):
            self.assertTrue(
                verify_slack_signature(
                    body,
                    signature,
                    {"X-Slack-Request-Timestamp": timestamp},
                )
            )

    def test_invalid_signature(self):
        body = b"payload=test"
        timestamp = str(int(datetime.now().timestamp()))

        with patch.dict(
            os.environ,
            {
                "SLACK_SIGNING_SECRET": "my-secret",
                "ENVIRONMENT": "production",
                "ALLOW_INSECURE_SLACK_WEBHOOK": "false",
            },
            clear=False,
        ):
            self.assertFalse(
                verify_slack_signature(
                    body,
                    "v0=invalid",
                    {"X-Slack-Request-Timestamp": timestamp},
                )
            )

    def test_missing_timestamp(self):
        body = b"payload=test"

        with patch.dict(
            os.environ,
            {
                "SLACK_SIGNING_SECRET": "my-secret",
                "ENVIRONMENT": "production",
                "ALLOW_INSECURE_SLACK_WEBHOOK": "false",
            },
            clear=False,
        ):
            self.assertFalse(verify_slack_signature(body, "v0=something", {}))

    def test_stale_timestamp(self):
        body = b"payload=test"
        secret = "my-secret"
        stale_timestamp = str(int(datetime.now().timestamp()) - 600)
        signature = self._sign(secret, stale_timestamp, body)

        with patch.dict(
            os.environ,
            {
                "SLACK_SIGNING_SECRET": secret,
                "ENVIRONMENT": "production",
                "ALLOW_INSECURE_SLACK_WEBHOOK": "false",
            },
            clear=False,
        ):
            self.assertFalse(
                verify_slack_signature(
                    body,
                    signature,
                    {"X-Slack-Request-Timestamp": stale_timestamp},
                )
            )

    def test_missing_secret_behavior_by_environment(self):
        body = b"payload=test"
        timestamp = str(int(datetime.now().timestamp()))

        with patch.dict(
            os.environ,
            {
                "SLACK_SIGNING_SECRET": "",
                "ENVIRONMENT": "production",
                "ALLOW_INSECURE_SLACK_WEBHOOK": "false",
            },
            clear=False,
        ):
            self.assertFalse(
                verify_slack_signature(
                    body,
                    "v0=anything",
                    {"X-Slack-Request-Timestamp": timestamp},
                )
            )

        with patch.dict(
            os.environ,
            {
                "SLACK_SIGNING_SECRET": "",
                "ENVIRONMENT": "development",
                "ALLOW_INSECURE_SLACK_WEBHOOK": "true",
            },
            clear=False,
        ):
            self.assertTrue(
                verify_slack_signature(
                    body,
                    "v0=anything",
                    {"X-Slack-Request-Timestamp": timestamp},
                )
            )


if __name__ == "__main__":
    unittest.main()
