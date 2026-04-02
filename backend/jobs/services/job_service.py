from django.db.models import OuterRef, Subquery
from django.utils import timezone

from jobs.constants import MAX_API_PAGE_SIZE
from jobs.models import Job, JobStatus


def create_job(name: str) -> Job:
    """Create a new job and record an initial PENDING status.

    Args:
        name: Display name for the job.

    Returns:
        The newly created Job with ``current_status`` set to PENDING.
    """
    job = Job.objects.create(name=name)
    JobStatus.objects.create(
        job=job,
        status_type=JobStatus.StatusType.PENDING,
        timestamp=timezone.now(),
    )
    job.current_status = JobStatus.StatusType.PENDING
    return job


def update_job_status(job_id: int, status_type: str) -> Job:
    """Append a new status entry to a job and return the updated job.

    Args:
        job_id: Primary key of the job to update.
        status_type: One of the ``JobStatus.StatusType`` values.

    Returns:
        The Job instance with ``current_status`` set to the new status.

    Raises:
        Job.DoesNotExist: If no job with the given ID exists.
    """
    job = Job.objects.get(pk=job_id)
    JobStatus.objects.create(
        job=job,
        status_type=status_type,
        timestamp=timezone.now(),
    )
    job.current_status = status_type
    return job


def delete_job(job_id: int) -> None:
    """Delete a job and all its associated statuses.

    Args:
        job_id: Primary key of the job to delete.

    Raises:
        Job.DoesNotExist: If no job with the given ID exists.
    """
    job = Job.objects.get(pk=job_id)
    job.delete()


def get_job(job_id: int) -> Job:
    """Return a single job with its current status and full status history.

    Args:
        job_id: Primary key of the job to fetch.

    Returns:
        The Job instance with ``current_status`` and ``status_history`` set.

    Raises:
        Job.DoesNotExist: If no job with the given ID exists.
    """
    job = Job.objects.get(pk=job_id)
    statuses = list(job.statuses.order_by("-timestamp"))
    job.current_status = statuses[0].status_type if statuses else None
    job.status_history = statuses
    return job


def get_all_jobs(
    page: int,
    page_size: int,
    status: str = "",
    search: str = "",
) -> tuple[list, int]:
    """Return a paginated, optionally filtered page of jobs with their current status.

    Args:
        page: 1-based page number.
        page_size: Number of results per page (max ``MAX_API_PAGE_SIZE``).
        status: If non-empty, restrict to jobs whose current status matches this value.
        search: If non-empty, restrict to jobs whose name contains this string (case-insensitive).

    Returns:
        A tuple of ``(jobs, total)`` where ``jobs`` is a list of Job instances annotated
        with ``current_status`` and ``total`` is the count of all matching jobs.
    """
    latest_status = (
        JobStatus.objects.filter(job=OuterRef("pk"))
        .order_by("-timestamp")
        .values("status_type")[:1]
    )

    qs = Job.objects.annotate(current_status=Subquery(latest_status)).order_by(
        "-created_at"
    )

    if status:
        qs = qs.filter(current_status=status)
    if search:
        qs = qs.filter(name__icontains=search)

    total = qs.count()
    offset = (page - 1) * page_size
    return list(qs[offset : offset + page_size]), total
