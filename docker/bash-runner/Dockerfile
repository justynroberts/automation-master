FROM alpine:latest

# Install bash and common utilities
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    jq \
    git \
    python3 \
    nodejs \
    npm \
    openssh-client \
    rsync \
    unzip \
    zip

# Create non-root user for security
RUN adduser -D -s /bin/bash scriptuser

# Create workspace directory
RUN mkdir -p /workspace && chown scriptuser:scriptuser /workspace

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER scriptuser
WORKDIR /workspace

ENTRYPOINT ["/entrypoint.sh"]