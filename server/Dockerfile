FROM node:22-alpine

# Install pnpm using corepack
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate

WORKDIR /app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml* ./

# Install packages
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
