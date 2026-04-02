from django.db import models


class Job(models.Model):
    """Represents an HPC job with a name and lifecycle timestamps."""

    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobs"

    def __str__(self) -> str:
        return self.name
