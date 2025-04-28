FROM python:3.11-slim as base

WORKDIR /app
COPY ./backend/common /app/common

# Install common dependencies
RUN pip install --no-cache-dir httpx pydantic

# Local backend stage
FROM base as local
ARG MODE=local
COPY ./backend/local/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY ./backend/local /app/local
CMD ["python", "local/main.py"]

# Online backend stage
FROM base as online
ARG MODE=online
COPY ./backend/online/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY ./backend/online /app/online
CMD ["python", "online/main.py"]

# Final stage - determined by MODE arg
FROM ${MODE} as final
EXPOSE 8000
