FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Install common Python packages
RUN pip install --no-cache-dir \
    requests \
    pandas \
    numpy \
    beautifulsoup4 \
    lxml \
    python-dateutil \
    pytz \
    jsonschema

# Create non-root user for security
RUN useradd -m -s /bin/bash scriptuser

# Create workspace directory
RUN mkdir -p /workspace && chown scriptuser:scriptuser /workspace

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER scriptuser
WORKDIR /workspace

ENTRYPOINT ["/entrypoint.sh"]