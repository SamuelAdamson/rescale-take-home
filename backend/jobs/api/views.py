from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.api.serializers import CreateJobSerializer, JobSerializer, JobWithHistorySerializer, UpdateJobStatusSerializer
from jobs.constants import MAX_API_PAGE_SIZE
from jobs.models import Job
from jobs.services.job_service import create_job, delete_job, get_all_jobs, get_job, update_job_status


class JobListView(APIView):
    """Handles listing all jobs and creating new ones."""

    def get(self, request: Request) -> Response:
        """Return a paginated, optionally filtered list of jobs.

        Query parameters:
            page (required): 1-based page number.
            page_size (required): Number of results per page (max ``MAX_API_PAGE_SIZE``).
            status (optional): Filter by current status value.
            search (optional): Filter by job name substring (case-insensitive).

        Args:
            request: The incoming HTTP request.
        """
        page_str = request.query_params.get("page")
        page_size_str = request.query_params.get("page_size")

        if page_str is None or page_size_str is None:
            return Response(
                {"detail": "page and page_size are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            page = int(page_str)
            page_size = int(page_size_str)
        except ValueError:
            return Response(
                {"detail": "page and page_size must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page < 1 or page_size < 1 or page_size > MAX_API_PAGE_SIZE:
            return Response(
                {"detail": f"page must be >= 1 and page_size must be between 1 and {MAX_API_PAGE_SIZE}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_param = request.query_params.get("status", "")
        search_param = request.query_params.get("search", "")

        jobs, total = get_all_jobs(
            page=page,
            page_size=page_size,
            status=status_param,
            search=search_param,
        )
        serializer = JobSerializer(jobs, many=True)
        return Response({"count": total, "results": serializer.data})

    def post(self, request: Request) -> Response:
        """Create a new job with an initial PENDING status.

        Args:
            request: The incoming HTTP request. Expected body: ``{"name": "<job name>"}``.
        """
        serializer = CreateJobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = create_job(name=serializer.validated_data["name"])
        return Response(JobSerializer(job).data, status=status.HTTP_201_CREATED)


class JobDetailView(APIView):
    """Handles retrieving, updating, and deleting individual jobs."""

    def get(self, request: Request, id: int) -> Response:
        """Return a single job with its full status history.

        Args:
            request: The incoming HTTP request.
            id: Primary key of the job to retrieve.
        """
        try:
            job = get_job(job_id=id)
        except Job.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(JobWithHistorySerializer(job).data)

    def patch(self, request: Request, id: int) -> Response:
        """Append a new status entry to the given job.

        Args:
            request: The incoming HTTP request. Expected body: ``{"status_type": "<status>"}``.
            id: Primary key of the job to update.
        """
        serializer = UpdateJobStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            job = update_job_status(
                job_id=id,
                status_type=serializer.validated_data["status_type"],
            )
        except Job.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(JobSerializer(job).data)

    def delete(self, request: Request, id: int) -> Response:
        """Delete the given job and all its associated statuses.

        Args:
            request: The incoming HTTP request.
            id: Primary key of the job to delete.
        """
        try:
            delete_job(job_id=id)
        except Job.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
