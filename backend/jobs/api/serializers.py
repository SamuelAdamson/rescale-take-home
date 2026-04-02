from rest_framework import serializers

from jobs.models import Job, JobStatus


class CreateJobSerializer(serializers.Serializer):
    """Validates input for creating a new job."""

    name = serializers.CharField(min_length=1, max_length=255, trim_whitespace=True)

    def validate_name(self, value: str) -> str:
        if " " in value:
            raise serializers.ValidationError("Job name must not contain spaces.")
        return value


class UpdateJobStatusSerializer(serializers.Serializer):
    """Validates input for updating a job's status."""

    status_type = serializers.ChoiceField(choices=JobStatus.StatusType.choices)


class JobSerializer(serializers.ModelSerializer):
    """Serializes a Job instance, including its current (latest) status."""

    current_status = serializers.CharField(read_only=True, default=None)

    class Meta:
        model = Job
        fields = ["id", "name", "current_status", "created_at", "updated_at"]


class JobStatusSerializer(serializers.ModelSerializer):
    """Serializes a single JobStatus entry."""

    class Meta:
        model = JobStatus
        fields = ["id", "status_type", "timestamp"]


class JobWithHistorySerializer(serializers.ModelSerializer):
    """Serializes a Job instance with its full status history."""

    current_status = serializers.CharField(read_only=True, default=None)
    status_history = JobStatusSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = ["id", "name", "current_status", "created_at", "updated_at", "status_history"]
