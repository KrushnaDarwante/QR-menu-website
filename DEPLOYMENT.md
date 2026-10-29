# QR Dine OS - Deployment & Infrastructure (DEPLOYMENT.md)

## 1. Cloud Run / Containerized Architecture
The platform is packaged into an OCI-compliant container:
```dockerfile
# Multi-stage Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

## 2. Spring Boot 3.x Production Deployment
For high-scale multi-cluster environments:
- Spring Boot 3.4 on OpenJDK 21 LTS with GraalVM Native Image compilation or standard JVM container.
- Managed MySQL 8.4 database with Read Replicas.
- Flyway automated migrations on startup.
- Redis Cluster for distributed SSE session registry and pub/sub.
- Nginx / Cloudflare edge reverse proxy handling TLS termination, WAF, and DDoS mitigation.
