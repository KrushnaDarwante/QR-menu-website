# QR Dine OS - Environment Configuration (ENVIRONMENT.md)

## Environment Variables

| Variable | Description | Default | Required in Production |
|---|---|---|---|
| `PORT` | HTTP server listening port | `3000` | No |
| `NODE_ENV` | Runtime environment (`development`, `production`) | `development` | Yes |
| `APP_URL` | Canonical public URL of the application | `http://localhost:3000` | Yes |
| `GATEWAY_WEBHOOK_SECRET` | Secret key used to verify HMAC-SHA256 payment signatures | `qrdine_dev_secret_key_2026` | Yes |
| `JWT_SECRET` | Secret used for staff authentication tokens | `qrdine_jwt_super_secret` | Yes |
| `DATABASE_URL` | MySQL 8.4 database connection string | `mysql://root:root@localhost:3306/qrdine` | When using MySQL backend |
