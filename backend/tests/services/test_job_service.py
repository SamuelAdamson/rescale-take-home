from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from jobs.models import Job
from jobs.services.job_service import create_job, delete_job, get_all_jobs, get_job, update_job_status


class GetJobTests(SimpleTestCase):
    @patch("jobs.services.job_service.Job")
    def test_fetches_job_by_id(self, mock_job_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job.statuses.order_by.return_value = []
        mock_job_model.objects.get.return_value = mock_job

        get_job(job_id=5)

        mock_job_model.objects.get.assert_called_once_with(pk=5)

    @patch("jobs.services.job_service.Job")
    def test_sets_current_status_from_latest_status(self, mock_job_model: MagicMock) -> None:
        mock_status = MagicMock()
        mock_status.status_type = "RUNNING"
        mock_job = MagicMock()
        mock_job.statuses.order_by.return_value = [mock_status]
        mock_job_model.objects.get.return_value = mock_job

        result = get_job(job_id=1)

        self.assertEqual(result.current_status, "RUNNING")

    @patch("jobs.services.job_service.Job")
    def test_current_status_is_none_when_no_statuses(self, mock_job_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job.statuses.order_by.return_value = []
        mock_job_model.objects.get.return_value = mock_job

        result = get_job(job_id=1)

        self.assertIsNone(result.current_status)

    @patch("jobs.services.job_service.Job")
    def test_sets_status_history_on_returned_job(self, mock_job_model: MagicMock) -> None:
        mock_status_a = MagicMock()
        mock_status_b = MagicMock()
        mock_job = MagicMock()
        mock_job.statuses.order_by.return_value = [mock_status_a, mock_status_b]
        mock_job_model.objects.get.return_value = mock_job

        result = get_job(job_id=1)

        self.assertEqual(result.status_history, [mock_status_a, mock_status_b])

    @patch("jobs.services.job_service.Job")
    def test_orders_statuses_by_timestamp_descending(self, mock_job_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job.statuses.order_by.return_value = []
        mock_job_model.objects.get.return_value = mock_job

        get_job(job_id=1)

        mock_job.statuses.order_by.assert_called_once_with("-timestamp")

    @patch("jobs.services.job_service.Job")
    def test_raises_does_not_exist_for_unknown_job(self, mock_job_model: MagicMock) -> None:
        mock_job_model.DoesNotExist = Job.DoesNotExist
        mock_job_model.objects.get.side_effect = Job.DoesNotExist

        with self.assertRaises(Job.DoesNotExist):
            get_job(job_id=999)


class GetAllJobsTests(SimpleTestCase):
    @patch("jobs.services.job_service.Job")
    def test_annotates_queryset_with_current_status_subquery(self, mock_job_model: MagicMock) -> None:
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.filter.return_value = mock_qs
        mock_qs.count.return_value = 0
        mock_qs.__getitem__ = MagicMock(return_value=[])
        mock_job_model.objects.annotate.return_value = mock_qs

        get_all_jobs(page=1, page_size=10)

        mock_job_model.objects.annotate.assert_called_once()
        _, kwargs = mock_job_model.objects.annotate.call_args
        self.assertIn("current_status", kwargs)

    @patch("jobs.services.job_service.Job")
    def test_orders_by_created_at_descending(self, mock_job_model: MagicMock) -> None:
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.count.return_value = 0
        mock_qs.__getitem__ = MagicMock(return_value=[])
        mock_job_model.objects.annotate.return_value = mock_qs

        get_all_jobs(page=1, page_size=10)

        mock_qs.order_by.assert_called_once_with("-created_at")

    @patch("jobs.services.job_service.Job")
    def test_returns_list_and_total_count(self, mock_job_model: MagicMock) -> None:
        mock_jobs = [MagicMock(), MagicMock()]
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.count.return_value = 2
        mock_qs.__getitem__ = MagicMock(return_value=mock_jobs)
        mock_job_model.objects.annotate.return_value = mock_qs

        jobs, total = get_all_jobs(page=1, page_size=10)

        self.assertEqual(jobs, mock_jobs)
        self.assertEqual(total, 2)

    @patch("jobs.services.job_service.Job")
    def test_applies_status_filter_when_provided(self, mock_job_model: MagicMock) -> None:
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.filter.return_value = mock_qs
        mock_qs.count.return_value = 0
        mock_qs.__getitem__ = MagicMock(return_value=[])
        mock_job_model.objects.annotate.return_value = mock_qs

        get_all_jobs(page=1, page_size=10, status="RUNNING")

        mock_qs.filter.assert_any_call(current_status="RUNNING")

    @patch("jobs.services.job_service.Job")
    def test_skips_status_filter_when_empty(self, mock_job_model: MagicMock) -> None:
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.count.return_value = 0
        mock_qs.__getitem__ = MagicMock(return_value=[])
        mock_job_model.objects.annotate.return_value = mock_qs

        get_all_jobs(page=1, page_size=10, status="")

        mock_qs.filter.assert_not_called()

    @patch("jobs.services.job_service.Job")
    def test_applies_search_filter_when_provided(self, mock_job_model: MagicMock) -> None:
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.filter.return_value = mock_qs
        mock_qs.count.return_value = 0
        mock_qs.__getitem__ = MagicMock(return_value=[])
        mock_job_model.objects.annotate.return_value = mock_qs

        get_all_jobs(page=1, page_size=10, search="my-job")

        mock_qs.filter.assert_any_call(name__icontains="my-job")

    @patch("jobs.services.job_service.Job")
    def test_slices_queryset_for_correct_page(self, mock_job_model: MagicMock) -> None:
        mock_qs = MagicMock()
        mock_qs.order_by.return_value = mock_qs
        mock_qs.count.return_value = 30
        mock_qs.__getitem__ = MagicMock(return_value=[])
        mock_job_model.objects.annotate.return_value = mock_qs

        get_all_jobs(page=2, page_size=10)

        # page=2, page_size=10 → slice [10:20]
        mock_qs.__getitem__.assert_called_once_with(slice(10, 20))


class CreateJobTests(SimpleTestCase):
    @patch("jobs.services.job_service.JobStatus")
    @patch("jobs.services.job_service.Job")
    def test_creates_job_with_name(self, mock_job_model: MagicMock, mock_status_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job_model.objects.create.return_value = mock_job

        create_job(name="test-job")

        mock_job_model.objects.create.assert_called_once_with(name="test-job")

    @patch("jobs.services.job_service.timezone")
    @patch("jobs.services.job_service.JobStatus")
    @patch("jobs.services.job_service.Job")
    def test_creates_pending_status_for_new_job(self, mock_job_model: MagicMock, mock_status_model: MagicMock, mock_tz: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job_model.objects.create.return_value = mock_job
        mock_now = MagicMock()
        mock_tz.now.return_value = mock_now

        create_job(name="test-job")

        mock_status_model.objects.create.assert_called_once_with(
            job=mock_job,
            status_type=mock_status_model.StatusType.PENDING,
            timestamp=mock_now,
        )

    @patch("jobs.services.job_service.JobStatus")
    @patch("jobs.services.job_service.Job")
    def test_sets_current_status_on_returned_job(self, mock_job_model: MagicMock, mock_status_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job_model.objects.create.return_value = mock_job

        result = create_job(name="test-job")

        self.assertEqual(result.current_status, mock_status_model.StatusType.PENDING)
        self.assertEqual(result, mock_job)


class UpdateJobStatusTests(SimpleTestCase):
    @patch("jobs.services.job_service.timezone")
    @patch("jobs.services.job_service.JobStatus")
    @patch("jobs.services.job_service.Job")
    def test_creates_new_status_entry(self, mock_job_model: MagicMock, mock_status_model: MagicMock, mock_tz: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job_model.objects.get.return_value = mock_job
        mock_now = MagicMock()
        mock_tz.now.return_value = mock_now

        update_job_status(job_id=1, status_type="RUNNING")

        mock_status_model.objects.create.assert_called_once_with(
            job=mock_job,
            status_type="RUNNING",
            timestamp=mock_now,
        )

    @patch("jobs.services.job_service.JobStatus")
    @patch("jobs.services.job_service.Job")
    def test_sets_current_status_on_returned_job(self, mock_job_model: MagicMock, mock_status_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job_model.objects.get.return_value = mock_job

        result = update_job_status(job_id=1, status_type="COMPLETED")

        self.assertEqual(result.current_status, "COMPLETED")
        self.assertEqual(result, mock_job)

    @patch("jobs.services.job_service.Job")
    def test_raises_does_not_exist_for_unknown_job(self, mock_job_model: MagicMock) -> None:
        mock_job_model.DoesNotExist = Job.DoesNotExist
        mock_job_model.objects.get.side_effect = Job.DoesNotExist

        with self.assertRaises(Job.DoesNotExist):
            update_job_status(job_id=999, status_type="RUNNING")


class DeleteJobTests(SimpleTestCase):
    @patch("jobs.services.job_service.Job")
    def test_fetches_and_deletes_job(self, mock_job_model: MagicMock) -> None:
        mock_job = MagicMock()
        mock_job_model.objects.get.return_value = mock_job

        delete_job(job_id=1)

        mock_job_model.objects.get.assert_called_once_with(pk=1)
        mock_job.delete.assert_called_once()

    @patch("jobs.services.job_service.Job")
    def test_raises_does_not_exist_for_unknown_job(self, mock_job_model: MagicMock) -> None:
        mock_job_model.DoesNotExist = Job.DoesNotExist
        mock_job_model.objects.get.side_effect = Job.DoesNotExist

        with self.assertRaises(Job.DoesNotExist):
            delete_job(job_id=999)
