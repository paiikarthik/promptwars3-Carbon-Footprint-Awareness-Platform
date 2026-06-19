FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any are needed (none are strictly required for our stack)
# COPY requirements.txt and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose default port
EXPOSE 8080

# Run uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
