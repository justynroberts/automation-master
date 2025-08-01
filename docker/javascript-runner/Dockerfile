FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    git \
    openssh-client \
    bash

# Install common npm packages globally
RUN npm install -g \
    axios \
    lodash \
    moment \
    uuid \
    cheerio \
    csv-parser

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