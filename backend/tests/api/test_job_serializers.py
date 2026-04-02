from datetime import datetime, timezone

from django.test import SimpleTestCase

from jobs.api.serializers import JobSerializer, JobStatusSerializer, JobWithHistorySerializer
from jobs.models import Job, JobStatus

NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)


def make_job(current_status: str | None = None) -> Job:
    job = Job(id=1, name="test-job", created_at=NOW, updated_at=NOW)
    job.current_status = current_status
    return job


def make_job_with_history(
    current_status: str | None = None,
    status_history: list[JobStatus] | None = None,
) -> Job:
    job = Job(id=1, name="test-job", created_at=NOW, updated_at=NOW)
    job.current_status = current_status
    job.status_history = status_history if status_history is not None else []
    return job


def make_status(id: int, status_type: str) -> JobStatus:
    return JobStatus(id=id, job_id=1, status_type=status_type, timestamp=NOW)


class JobSerializerTests(SimpleTestCase):
    def test_includes_expected_fields(self) -> None:
        data = JobSerializer(make_job("PENDING")).data
        self.assertEqual(set(data.keys()), {"id", "name", "current_status", "created_at", "updated_at"})

    def test_serializes_current_status(self) -> None:
        data = JobSerializer(make_job("RUNNING")).data
        self.assertEqual(data["current_status"], "RUNNING")

    def test_current_status_is_none_when_no_statuses(self) -> None:
        data = JobSerializer(make_job(None)).data
        self.assertIsNone(data["current_status"])

    def test_serializes_job_name(self) -> None:
        data = JobSerializer(make_job()).data
        self.assertEqual(data["name"], "test-job")


class JobStatusSerializerTests(SimpleTestCase):
    def test_includes_expected_fields(self) -> None:
        data = JobStatusSerializer(make_status(1, "RUNNING")).data
        self.assertEqual(set(data.keys()), {"id", "status_type", "timestamp"})

    def test_serializes_status_type(self) -> None:
        data = JobStatusSerializer(make_status(1, "COMPLETED")).data
        self.assertEqual(data["status_type"], "COMPLETED")

    def test_serializes_timestamp(self) -> None:
        data = JobStatusSerializer(make_status(1, "PENDING")).data
        # DRF serializes datetimes as ISO 8601 strings
        self.assertIn("2026-01-01", data["timestamp"])

    def test_serializes_id(self) -> None:
        data = JobStatusSerializer(make_status(42, "FAILED")).data
        self.assertEqual(data["id"], 42)


class JobWithHistorySerializerTests(SimpleTestCase):
    def test_includes_expected_fields(self) -> None:
        data = JobWithHistorySerializer(make_job_with_history("PENDING")).data
        self.assertEqual(
            set(data.keys()),
            {"id", "name", "current_status", "created_at", "updated_at", "status_history"},
        )

    def test_serializes_status_history_entries(self) -> None:
        history = [make_status(1, "RUNNING"), make_status(2, "PENDING")]
        data = JobWithHistorySerializer(make_job_with_history("RUNNING", history)).data
        self.assertEqual(len(data["status_history"]), 2)
        self.assertEqual(data["status_history"][0]["status_type"], "RUNNING")
        self.assertEqual(data["status_history"][1]["status_type"], "PENDING")

    def test_empty_status_history_serializes_as_empty_list(self) -> None:
        data = JobWithHistorySerializer(make_job_with_history(None, [])).data
        self.assertEqual(data["status_history"], [])

    def test_serializes_current_status(self) -> None:
        data = JobWithHistorySerializer(make_job_with_history("FAILED")).data
        self.assertEqual(data["current_status"], "FAILED")

    def test_current_status_is_none_when_not_set(self) -> None:
        data = JobWithHistorySerializer(make_job_with_history(None)).data
        self.assertIsNone(data["current_status"])
