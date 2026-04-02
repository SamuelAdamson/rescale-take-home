# Job Management Dashboard

A full-stack dashboard for creating, monitoring, and managing compute jobs, built with Django and React.

## Project Structure

```
rescale-take-home/
├── docker-compose.yml
├── Makefile
├── backend/                # Django REST API
│   ├── config/             # Django project settings and entry points
│   ├── jobs/
│   │   ├── models/         # ORM models: Job, JobStatus
│   │   ├── services/       # Business logic layer
│   │   ├── api/            # Serializers, views, and URL routing
│   │   └── migrations/     # Django DB migrations
│   └── tests/
│       ├── api/            # View and serializer unit tests
│       └── services/       # Service layer unit tests
├── frontend/               # React + Vite + TypeScript
│   └── src/
│       ├── api/            # Centralized fetch/API calls
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Route-level page components
│       ├── types/          # Shared TypeScript types
│       ├── constants/      # App-wide constants
│       └── __tests__/      # Component, hook, and page unit tests
└── e2e/                    # Playwright end-to-end tests
    └── tests/              # Test definitions
```

## Prerequisites

Ensure the following tools are installed:

- bash
- docker
- docker compose v2
- make


## Build, Run, Test

### Docker

Build container images:

```bash
make build
```

Execute tests:

```bash
# Execute all tests
make test

# Test services individually
make backend_unit_test
make frontend_unit_test
make e2e_test
```

Run the application (detached container):

```bash
# Runs the Frontend on http://localhost:3000/
# Runs the API on http://localhost:8000/api/
make up
```

Navigate to http://localhost:3000/

Stop the application:

```bash
make stop
```

Clean environment (volumes, networks, orphaned volumes):

```bash
make clean
```

### Local Development (Optional)

These instructions describe how to run the application in your local environment outside of containers. This is useful for development. **Note** that the following prerequisites are required in addition to those mentioned in the previous section:

- postgresql >= 16
- python >=3.14,<3.15
- uv package manager
- nodejs >=24

Ensure the postgresql database is running and proper credentials are configured. See [backend/config/settings.py](backend/config/settings.py) for environment variable configuration.

Install backend dependencies (from the `backend/` directory):

```bash
uv sync
```

Run migrations and start the backend (from the `backend/` directory):

```bash
uv run manage.py migrate    # migrate django changes
uv run manage.py runserver  # run development server
```

Install frontend dependencies (from the `frontend/` directory):

```bash
npm install
```

Run the frontend (from the `frontend/` directory):

```bash
npm run dev
```

### Troubleshooting

**Permission denied connecting to Docker socket**

If you see `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock`, your user is not in the `docker` group. Run:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Then verify access with `docker ps` before retrying.


## Approach, Optimizations, and Other Thoughts

### Time spent

I spent approximately *6 hours* on this project.

### Accomplished Features

The following features are implemented in this application:

- Display jobs and job statuses
- Update job status
- Create new jobs (with client-side / API validation)
- Delete jobs
- Filter jobs by job name (search)
- Filter jobs by job status (select)
- Job details page
- Job status history (in job details page)

### Code Quality / Testability

The following steps are taken to ensure code quality and testability:

- Ruff checks for python API
- ESLint for TypeScript frontend
- Unit tests for backend
- Unit tests for frontend
- End-to-end test for job creation workflow


### Scaling to Millions of Jobs

In the project prompt the following scenario is posed:

```text
While building the application, consider web performance optimization. Imagine a scenario where there could be millions of jobs in the database.

Address how you would efficiently fetch and display this large dataset in the frontend.
```

To accommodate this, I have implemented the following in the application:

- **Database Indexing - JobStatus** - With millions of jobs comes millions of job status updates. We need to ensure that we can quickly fetch the latest job status when loading data into the frontend. To accommodate this I have updated the JobStatus model to use a composite key of `id` and `timestamp` (decreasing). Thus, when sorting by timestamp, a full database scan is not required. This should help reduce time to query latest status of all jobs.
- **Client-side Pagination** - The jobs are not displayed all at once. Instead, only 10 or 30 (depending on user selection) jobs are displayed at a time. This limits the amount of content which needs to be displayed in the browser at once. This reduces load on the client browser.
- **API Pagination / Filters** - With millions of jobs, client-side pagination is not enough: sending that much data in a single HTTP response is not practical, and it would put far too much strain on the client browser. 

Thus, we need to paginate results from the `GET /api/jobs/` endpoint. This endpoint now accepts parameters for `page_size`, `page` (page number), `status` (job status to filter by), and `search` (the search term to filter by). The API throws an error if we try to request a page size greater than 1000 (added as a constant). 

The primary drawback of this implementation is that more requests are made to the API. We could reduce the number of requests by adding an *API page size* in addition to the client page size. By decoupling the API page size and client page size, we can store more data on the client-side than what is actually displayed - only requesting new data when the user scrolls to a page which exceeds the currently stored data. This would help reduce the number requests, however filters and search terms would still require new data. I have not implemented this decoupled API page size / client page size, but I would consider it in production.
- **Various UI Considerations** - Where applicable, loading spinners are used to indicate to the user that data is loading.


### Finishing Touches

I included some Rescale-specific styling: favicon and logo. I tried to match the Rescale color scheme.


### With more time, I would focus on...

- **finer-grained page hydration, and making the UI less jumpy.** I would focus on things like preventing elements from rapidly resizing while waiting for new data. This is a side effect of loading spinners being momentarily rendered and resizing other elements. Additionally, I would closely evaluate exactly what needs to reload on API calls.
- **better styling**. This would become more relevant with more content.
- **weigh the drawbacks of API pagination.** For millions of jobs, I think API pagination would be necessary for the reasoning mentioned above. However, I would be cautious about implementing this due to the dramatic increase in requests. I would really drill-down into how many jobs we can expect in the database. Omitting the API pagination makes the UI feel a lot smoother.
- **mobile compatibility.** I would ensure that all UI elements are compatible with smaller screen sizes.

## AI Usage

I utilize AI in my work regularly. For this project I used Claude Code. I configured a `CLAUDE.md` markdown file to automatically attach project-wide guidelines for Claude. This file is included in the repository. The content in this file is primarily focused on coding standards.

Generally, I try to utilize AI dev tool agency as much as possible while still being *in touch* with the code (not vibe-coding, but getting a big efficiency boost). I believe there is a sweet spot where the coding agent and the developer are in equal understanding of the code. This is where I try to spend my development time.

Staying in touch with the code also means I can resolve errors introduced by the AI when they arise. My first instinct is always to have the AI fix its own mistakes, but I will intervene manually if that proves unproductive. Additionally, I will refactor code that is not readable or maintainable.

Oftentimes, I will prompt the coding agent to take an action, and then work on something else in parallel (either using another agent or manually). In fact, I am typing this while Claude is refining my E2E tests.

### Prompts and My Thoughts

#### Project and Backend Setup

```text
I have initialized a project using uv init in the folder backend. This will be an API using Postgres, please install the packages django, djangorestframework, and a postgres driver using "uv add". Create the boilerplate for the project with a folder "tests/".
```

```text
I have a gitignore created for the frontend, please create a relevant gitignore for the backend project
```

While AI is particularly effective at creating boilerplate code, I still think it's useful to use available initialization commands (i.e. uv init, npm create vite@latest, etc). This can save on API costs.

```text
Both the frontend and backend will need to be containerized. Create docker files for the frontend and backend. The docker files should have multiple stages for running tests. Create a docker-compose.yml. Create environment variables as necessary particularly to store DB credentials (backend) and API host/port (frontend).
```

I made sure the container setup happened early. I am a big fan of ensuring the code can deploy as early as possible to avoid major refactors later.

```text
Is the nginxconf set up to avoid cross origin issues between front-end and backend?
```

Since API and frontend are separate services, I wanted to make sure we don't run into CORS issues. Claude was very helpful in this regard.

```text
In the makefile create commands that do the following:

make build - builds the docker images
make up - starts the entire application using docker compose
make test - runs unit tests and later E2E tests (don't worry about the E2E tests for now)
make stop - stops running the docker containers
make clean - removes the docker volumes/networks if necessary for a clean slate
```

```text
Create two Django ORM models 'Job' and 'JobStatus'. They should have the following fields:

Job:
id: PK (auto-generated)
name: string representing the job's name
created_at: datetimefield automatically set on creation
updated_at: datetime field, automatically updated on each save

JobStatus:
id: PK (auto-generated)
job: a foreign key (Job model)
status_type: choice field (PENDING, RUNNING, COMPLETED, FAILED)
timestamp: datetime field, captures when status was recorded

Ensure clear file organization.
```

After this prompt I added `CLAUDE.md` file. This is my first time using Claude Code; my workplace only allows Copilot and Cline. Copilot does not support the `CLAUDE.md` file, so this was new to me. I do like the project-based context. I think a similar outcome can be achieved with custom modes (Cline).

```text
We need to ensure that the current job status is easily retrievable, can we modify the job status model to ensure recent statuses can be quickly retrieved?
```

I had an idea of what database optimizations would be useful, but I think it's useful/efficient to have the AI plan and implement.

#### Backend Features

```text
Add the API endpoint, business logic, and unit tests to support the following feature:

GET /api/jobs/: List all jobs. This endpoint should include the current status for each job (i.e., the status_type from the latest JobStatus entry for that job)
```

```text
The container starts, but when I try to hit `http://localhost:8000/api/jobs/` I get Server Error (500) immediately, with no logs on the server-side.
```

I encountered this error after implementing the first feature. This would have been tricky to debug due to lack of logs. Claude identified missing logging settings. After testing again, I pasted the full stacktrace of this error: `django.template.exceptions.TemplateDoesNotExist: rest_framework/api.html`. The issue was that the default renderer for Django is HTML, but this is a Django-only application. Before AI dev tools this would have required a significant amount of googling or searching through docs.

```text
Add the API endpoint, business logic, and unit tests to support the following feature:

POST /api/jobs/: Create a new job. Upon creation, an initial JobStatus entry (e.g., PENDING) should be automatically created for this job.
```

```text
Add the API endpoint, business logic, and unit tests to support the following feature:

PATCH /api/jobs/<id>/: Update a job. This action should involve creating a new JobStatus entry for the job with the updated status_type.
```

```text
Add the API endpoint, business logic, and unit tests to support the following feature:

DELETE /api/jobs/<id>/: Delete a specific job. Ensure that all associated JobStatus entries are also deleted.
```

Once a repeatable pattern is established, AI is particularly good at iterating and introducing new features. A good goal in development is to quickly get the first set of functionality and then let the AI efficiently follow through with additional features.

```text
Add type suggestions and docstrings to all functions and models in the backend
```

```text
Add type hints to all unit tests in backend tests
```

#### Frontend Setup

```text
Install react router in the project using commands and add any additional packages for typescript
```

```text
In the `App` component incorporate React router. Outside of the rendered route, create a navigation bar. The navigation bar should only have two navigation options - an image in the top left that links to `/` and a link in the top right to `jobs`. Please style the jobs link so that the text is underlined on hover.
```

```text
Update the styling so that there is a light background. All content including the navbar has a reasonable max-width. The styling should look like a modern cloud platform utilizing colors like various shades of dark blue.
```

```text
Make the background of the navbar light colored. Change the button on hover effect - the underline should populate from right to left. Increase the font size on the navbar and the height of the image.
```

```text
Remove the background color on the navbar keep it the same as the rest of the application
```

```text
Make the nav link start out completely black then transition to the blue
```

```text
Add a new type of nav-link which navigates to an external site: https://github.com/SamuelAdamson/rescale-take-home/blob/main/README.md

External links should be noticeably different from the internal links. It should start with a background color, on hover the background should faid out. The background should be square/rounded but very square.
```

```text
Make the background black initially, it should also have the same underline effect that the internal links have
```

```text
Remove the underline effect, but make it so that the highlight does not disappear completely on hover
```

```text
The logo home image looks greyed out, can we increase the brightness on the filter?
```

The above prompts are some quick initial styling for the app.

```text
Create a feature which lists all jobs and shows their current status — use the /api/jobs endpoint. Create componenets Dashboard, JobList, JobPreview. In the job list, show the first 20 jobs, paginated, color-coded status, different icons per status.

Implement three components 'Dashboard', 'JobList', 'JobPreview'.
```

I like to utilize a *one-hand-on-the-wheel* approach sometimes when implementing features which will have widespread impacts across the project. In this case, I specify which components should be created. If I were implementing without AI, I would want these three components.

Truthfully AI is pretty good at making design decisions on its own, so often it's better to allocate design decisions to the AI for the sake of efficiency.

#### Frontend Features

```text
Update the UI so that there is an outline of the JobList even if no jobs have been created yet. Show the arrows to change pages all the time and show the current page i.e. 0 of 10.
```

```text
The JobPreview should expand on click and show: status change options, a link to a job details page, an option to delete the job.
```

```text
Create an option above the JobList on the dashboard to create a job. This should open a modal with a Job name field. Ensure that clientside validation checks the job name for character limit (between 1 and 255) and checks there are no spaces.
```

```text
Add a debounced search bar on the left side of the dashboard to filter jobs by name. Make sure the Create Job + button is on the right side, search jobs on the left side (justify-content: space-between).
```

```text
Update the JobPreview UI: view details button on the left of the status with nav-link underline; clicking anywhere else on the row opens dropdown. Ensure delete button and status selection are positioned the same vertically.
```

```text
On the JobPreview, clicking the status opens the dropdown. In the dropdown, show all statuses, current highlighted. Remove "Set Status:" text. Delete button solid red.
```

```text
Add a delete confirmation modal, reuse functionality of the create modal.
```

```text
The JobList component is overflowing - handle overflow with a scrollbar, show it always. Style the scrolbar with no chevrons, thin transparent track, small gray rounded thumb, pad so that scrollbar does not extend to edges of box.
```

```text
On the App component (outside of router), add a small black footer with centered text "Thanks for your consideration!"
```

```text
Create unit tests for the frontend. Ensure all calls to the API service are mocked.
```

```text
Rather than hard-coding the clientside page size for jobs, allow the user to select from two options: 10 and 30.
```

UI changes can be made significantly quicker using AI tools, but validation of functionality and reviewing code is still important. I always scan all changes after implementation.

#### More Frontend Features

```text
Implement the Job Details page now. 

Task 1: This should display the Job Name at the top of the page along with a selection for changing the job status similar to that in the JobPreview.

Task 2: Job Details page should include a JobHistory - a scrollable graph-like display which shows all the timestamped JobStatuses. Utilize Tailwind CSS. This JobHistory section should be in a container similar to JobList - separate and reuse this component

Task 3: Include a delete button in the bottom right of the page. This should use the modal exactly the same way as the preview.
```

```text
Add unit tests in backend and frontend to cover new functionality.
```

When setting my project context, I should make sure to include some directive like *ensure all features are covered in unit tests*.

#### Optimizations and E2E Testing

```text
We may need to scale to millions of jobs. To accommodate, implement API pagination on the GET /api/jobs/ endpoint. Add a constant on the backend called API_PAGE_SIZE and set this value to 1000. Requets exceeding this page size should error. Update the endpoint to accept required parameters (i.e. page_size, page, status, search). Update tests in the backend to accommodate. Update frontend code and tests to accommodate.
```

This is a significant change made by the AI, so after implementation I review code and perform all checks:

- Build the project
- Run tests
- Run code quality checks
- Run the application (user acceptance testing)
- Evaluate the code qualitatively to make sure it is organized and readable

Typically if issues arise, I will try to resolve them using the AI tool first. However, I think this is also why it's important to be in touch with the code. It's possible that the AI introduces breaking changes that can be difficult to undo (getting stuck in a loop of unproductive prompts). In this case a linting problem was introduced, but the AI resolved it with one prompt. If that was not the case, I still have a solid understanding of the changes that were made, and I would be able to resolve them manually.

After these changes were implemented a linting problem was introduced (fixed by AI with subsequent prompt):

```text
Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/app/src/hooks/useJobs.ts:28:5
  26 |
  27 |   useEffect(() => {
> 28 |     setLoading(true);
     |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
  29 |     fetchJobs({ page, page_size, status, search })
  30 |       .then(({ count, results }) => {
  31 |         setJobs(results);  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)
```

```text
I want to make the UI less jumpy during loads of new data. On the Dashboard, while job data is loading, can we put the loading spinner inside the job list rather than replacing the job list. This way the joblist doesn't rapidly disappear and reappear.
```

```text
In JobDetail page I want to avoid rapid resizing due to reloading content on every job status change. Update the code so that loading spinners are shown on initial page load, but subsequent (refetch) does not rapidly render and remove loading spinners everytime the status changes.
```

Changing job status created very jumpy UI behavior in the job details page because loading spinners were rendered and then quickly unrendered when the user changes the job status. My quick fix was to prevent the appearance of loading spinners when the user changes job status. On a local machine this has a nice, smooth appearance because the API response returns very quickly (no need for any loading spinner).

In production I would focus on make the loading spinner more finely grained or smoothly implemented - it is possible that the response takes a long time to reach the frontend, so having a loading spinner is still important. However, we should implement it in a way that does not create a jarring UI effect.

```text
I have initialized an end to end test suite in the e2e folder. Create an E2E test which tests the job creation workflow and ensures that the job gets created (appears in list). Create an appropriate docker file and add a service to docker compose. Ensure that the db, backend, and frontend containers stop after running e2e test completes.
```

```text
Proofread the readme. Check for grammar and suggest stylistic changes.
```
