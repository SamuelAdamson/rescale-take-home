from django.urls import path

from jobs.api.views import JobDetailView, JobListView

urlpatterns = [
    path("api/jobs/", JobListView.as_view(), name="job-list"),
    path("api/jobs/<int:id>/", JobDetailView.as_view(), name="job-detail"),
]
