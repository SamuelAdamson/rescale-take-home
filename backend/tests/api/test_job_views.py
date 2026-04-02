from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from django.test import RequestFactory, SimpleTestCase
from rest_framework import status
from rest_framework.response import Response

from jobs.api.views import JobDetailView, JobListView
from jobs.constants import MAX_API_PAGE_SIZE
from jobs.models import Job, JobStatus

JobStatusType = JobStatus.StatusType

NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)


def make_job(id: int, name: str, current_status: str | None = None) -> Job:
    job = Job(id=id, name=name, created_at=NOW, updated_at=NOW)
    job.current_status = current_status
    return job


def make_job_with_history(
    id: int,
    name: str,
    current_status: str | None = None,
    status_history: list[JobStatus] | None = None,
) -> Job:
    job = Job(id=id, name=name, created_at=NOW, updated_at=NOW)
    job.current_status = current_status
    job.status_history = status_history if status_history is not None else []
    return job


def make_status(id: int, status_type: str) -> JobStatus:
    return JobStatus(id=id, job_id=1, status_type=status_type, timestamp=NOW)


class JobListViewTests(SimpleTestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()

    def _get(self, page: int = 1, page_size: int = 10, status: str = "", search: str = "") -> Response:
        params: dict[str, object] = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        request = self.factory.get("/api/jobs/", data=params)
        return JobListView.as_view()(request)

    @patch("jobs.api.views.get_all_jobs")
    def test_returns_200(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        response = self._get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("jobs.api.views.get_all_jobs")
    def test_response_shape_contains_count_and_results(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        response = self._get()
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)

    @patch("jobs.api.views.get_all_jobs")
    def test_returns_empty_results_when_no_jobs(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        response = self._get()
        self.assertEqual(response.data["results"], [])
        self.assertEqual(response.data["count"], 0)

    @patch("jobs.api.views.get_all_jobs")
    def test_returns_jobs_with_current_status(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = (
            [make_job(1, "job-a", "RUNNING"), make_job(2, "job-b", "COMPLETED")],
            2,
        )
        response = self._get()
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["name"], "job-a")
        self.assertEqual(results[0]["current_status"], "RUNNING")
        self.assertEqual(results[1]["name"], "job-b")
        self.assertEqual(results[1]["current_status"], "COMPLETED")

    @patch("jobs.api.views.get_all_jobs")
    def test_count_reflects_total_not_page_length(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([make_job(1, "job-a", "PENDING")], 42)
        response = self._get()
        self.assertEqual(response.data["count"], 42)
        self.assertEqual(len(response.data["results"]), 1)

    @patch("jobs.api.views.get_all_jobs")
    def test_passes_page_and_page_size_to_service(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        self._get(page=3, page_size=25)
        mock_get_all_jobs.assert_called_once_with(page=3, page_size=25, status="", search="")

    @patch("jobs.api.views.get_all_jobs")
    def test_passes_status_filter_to_service(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        self._get(status="RUNNING")
        mock_get_all_jobs.assert_called_once_with(page=1, page_size=10, status="RUNNING", search="")

    @patch("jobs.api.views.get_all_jobs")
    def test_passes_search_to_service(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        self._get(search="my-job")
        mock_get_all_jobs.assert_called_once_with(page=1, page_size=10, status="", search="my-job")

    @patch("jobs.api.views.get_all_jobs")
    def test_current_status_is_null_for_job_with_no_statuses(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([make_job(1, "new-job", None)], 1)
        response = self._get()
        self.assertIsNone(response.data["results"][0]["current_status"])

    @patch("jobs.api.views.get_all_jobs")
    def test_result_items_contain_expected_fields(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([make_job(1, "job-a", "PENDING")], 1)
        response = self._get()
        self.assertEqual(
            set(response.data["results"][0].keys()),
            {"id", "name", "current_status", "created_at", "updated_at"},
        )

    def test_returns_400_when_page_missing(self) -> None:
        request = self.factory.get("/api/jobs/", data={"page_size": 10})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_page_size_missing(self) -> None:
        request = self.factory.get("/api/jobs/", data={"page": 1})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_page_is_not_integer(self) -> None:
        request = self.factory.get("/api/jobs/", data={"page": "abc", "page_size": 10})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_page_size_is_not_integer(self) -> None:
        request = self.factory.get("/api/jobs/", data={"page": 1, "page_size": "big"})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_page_is_zero(self) -> None:
        request = self.factory.get("/api/jobs/", data={"page": 0, "page_size": 10})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_page_size_exceeds_max(self) -> None:
        request = self.factory.get("/api/jobs/", data={"page": 1, "page_size": MAX_API_PAGE_SIZE + 1})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("jobs.api.views.get_all_jobs")
    def test_accepts_page_size_equal_to_max(self, mock_get_all_jobs: MagicMock) -> None:
        mock_get_all_jobs.return_value = ([], 0)
        request = self.factory.get("/api/jobs/", data={"page": 1, "page_size": MAX_API_PAGE_SIZE})
        response = JobListView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CreateJobViewTests(SimpleTestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()

    def _post(self, data: dict[str, object]) -> Response:
        request = self.factory.post("/api/jobs/", data=data, content_type="application/json")
        return JobListView.as_view()(request)

    @patch("jobs.api.views.create_job")
    def test_returns_201(self, mock_create_job: MagicMock) -> None:
        mock_create_job.return_value = make_job(1, "new-job", "PENDING")
        response = self._post({"name": "new-job"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch("jobs.api.views.create_job")
    def test_calls_service_with_name(self, mock_create_job: MagicMock) -> None:
        mock_create_job.return_value = make_job(1, "new-job", "PENDING")
        self._post({"name": "new-job"})
        mock_create_job.assert_called_once_with(name="new-job")

    @patch("jobs.api.views.create_job")
    def test_response_contains_pending_status(self, mock_create_job: MagicMock) -> None:
        mock_create_job.return_value = make_job(1, "new-job", JobStatus.StatusType.PENDING)
        response = self._post({"name": "new-job"})
        self.assertEqual(response.data["current_status"], "PENDING")

    @patch("jobs.api.views.create_job")
    def test_response_contains_expected_fields(self, mock_create_job: MagicMock) -> None:
        mock_create_job.return_value = make_job(1, "new-job", "PENDING")
        response = self._post({"name": "new-job"})
        self.assertEqual(
            set(response.data.keys()),
            {"id", "name", "current_status", "created_at", "updated_at"},
        )

    def test_returns_400_when_name_missing(self) -> None:
        response = self._post({})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_name_empty(self) -> None:
        response = self._post({"name": ""})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GetJobDetailViewTests(SimpleTestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()

    def _get(self, job_id: int) -> Response:
        request = self.factory.get(f"/api/jobs/{job_id}/")
        return JobDetailView.as_view()(request, id=job_id)

    @patch("jobs.api.views.get_job")
    def test_returns_200(self, mock_get_job: MagicMock) -> None:
        mock_get_job.return_value = make_job_with_history(1, "job-a", "RUNNING")
        response = self._get(1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("jobs.api.views.get_job")
    def test_calls_service_with_correct_id(self, mock_get_job: MagicMock) -> None:
        mock_get_job.return_value = make_job_with_history(1, "job-a", "RUNNING")
        self._get(1)
        mock_get_job.assert_called_once_with(job_id=1)

    @patch("jobs.api.views.get_job")
    def test_response_contains_expected_fields(self, mock_get_job: MagicMock) -> None:
        mock_get_job.return_value = make_job_with_history(1, "job-a", "PENDING")
        response = self._get(1)
        self.assertEqual(
            set(response.data.keys()),
            {"id", "name", "current_status", "created_at", "updated_at", "status_history"},
        )

    @patch("jobs.api.views.get_job")
    def test_response_includes_status_history(self, mock_get_job: MagicMock) -> None:
        history = [make_status(1, "RUNNING"), make_status(2, "PENDING")]
        mock_get_job.return_value = make_job_with_history(1, "job-a", "RUNNING", history)
        response = self._get(1)
        self.assertEqual(len(response.data["status_history"]), 2)
        self.assertEqual(response.data["status_history"][0]["status_type"], "RUNNING")
        self.assertEqual(response.data["status_history"][1]["status_type"], "PENDING")

    @patch("jobs.api.views.get_job")
    def test_empty_status_history_returns_empty_list(self, mock_get_job: MagicMock) -> None:
        mock_get_job.return_value = make_job_with_history(1, "job-a", None, [])
        response = self._get(1)
        self.assertEqual(response.data["status_history"], [])

    @patch("jobs.api.views.get_job")
    def test_returns_404_when_job_not_found(self, mock_get_job: MagicMock) -> None:
        mock_get_job.side_effect = Job.DoesNotExist
        response = self._get(999)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UpdateJobStatusViewTests(SimpleTestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()

    def _patch(self, job_id: int, data: dict[str, object]) -> Response:
        request = self.factory.patch(
            f"/api/jobs/{job_id}/", data=data, content_type="application/json"
        )
        return JobDetailView.as_view()(request, id=job_id)

    @patch("jobs.api.views.update_job_status")
    def test_returns_200(self, mock_update: MagicMock) -> None:
        mock_update.return_value = make_job(1, "job-a", "RUNNING")
        response = self._patch(1, {"status_type": "RUNNING"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("jobs.api.views.update_job_status")
    def test_calls_service_with_correct_args(self, mock_update: MagicMock) -> None:
        mock_update.return_value = make_job(1, "job-a", "RUNNING")
        self._patch(1, {"status_type": "RUNNING"})
        mock_update.assert_called_once_with(job_id=1, status_type="RUNNING")

    @patch("jobs.api.views.update_job_status")
    def test_response_reflects_updated_status(self, mock_update: MagicMock) -> None:
        mock_update.return_value = make_job(1, "job-a", "COMPLETED")
        response = self._patch(1, {"status_type": "COMPLETED"})
        self.assertEqual(response.data["current_status"], "COMPLETED")

    @patch("jobs.api.views.update_job_status")
    def test_returns_404_when_job_not_found(self, mock_update: MagicMock) -> None:
        mock_update.side_effect = Job.DoesNotExist
        response = self._patch(999, {"status_type": "RUNNING"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_returns_400_when_status_type_missing(self) -> None:
        response = self._patch(1, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_status_type_invalid(self) -> None:
        response = self._patch(1, {"status_type": "INVALID"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DeleteJobViewTests(SimpleTestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()

    def _delete(self, job_id: int) -> Response:
        request = self.factory.delete(f"/api/jobs/{job_id}/")
        return JobDetailView.as_view()(request, id=job_id)

    @patch("jobs.api.views.delete_job")
    def test_returns_204(self, mock_delete: MagicMock) -> None:
        response = self._delete(1)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    @patch("jobs.api.views.delete_job")
    def test_calls_service_with_correct_id(self, mock_delete: MagicMock) -> None:
        self._delete(1)
        mock_delete.assert_called_once_with(job_id=1)

    @patch("jobs.api.views.delete_job")
    def test_returns_404_when_job_not_found(self, mock_delete: MagicMock) -> None:
        mock_delete.side_effect = Job.DoesNotExist
        response = self._delete(999)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
