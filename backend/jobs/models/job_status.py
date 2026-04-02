from django.db import models

from .job import Job


class JobStatus(models.Model):
    """Records a status transition for a Job at a point in time."""

    class StatusType(models.TextChoices):
        PENDING = "PENDING"
        RUNNING = "RUNNING"
        COMPLETED = "COMPLETED"
        FAILED = "FAILED"

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="statuses")
    status_type = models.CharField(max_length=20, choices=StatusType.choices)
    timestamp = models.DateTimeField()

    class Meta:
        db_table = "job_statuses"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["job", "-timestamp"], name="idx_job_status_job_timestamp"),
        ]

    def __str__(self) -> str:
        return f"{self.job.name} - {self.status_type} at {self.timestamp}"
