# Adaptive Gateway

`adaptive-gateway` is a lightweight Express-compatible gateway middleware with caching, circuit-breaker fallback, and rate limiting.

## Install

```bash
npm install adaptive-gateway
```

## Usage

```js
import express from 'express';
import gateKeep from 'adaptive-gateway';

const app = express();

app.use(express.json());

app.use('/proxy', gateKeep({
  target: 'http://localhost:3000',
  ttl: 300,
  latencyThreshold: 500,
  pathRewrite: path => path.replace(/^\/proxy/, ''),
  breakerOptions: {
    timeout: 8000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
  }
}));

app.listen(4000, () => {
  console.log('Gateway running on http://localhost:4000');
});
```

## Named exports

```js
import { adaptiveGateway, createGateKeepMiddleware, gateKeep } from 'adaptive-gateway';
```

- `adaptiveGateway(options)` — gateway wrapper with built-in rate limiting
- `createGateKeepMiddleware(options)` — reusable middleware factory
- `gateKeep` — alias for `createGateKeepMiddleware`

## Options

- `target` — backend URL to proxy to
- `ttl` — cache TTL in seconds
- `latencyThreshold` — threshold for request caching decisions
- `pathRewrite` — function to rewrite the incoming request path before proxying
- `breakerOptions` — opossum circuit breaker configuration

## Notes

This package is designed to be used in an Express app and assumes a Redis client and metrics pipeline are configured in the local project.

## Publishing

### Option 1: Publish locally with 2FA

If your npm account uses two-factor authentication, publish with an OTP:

```bash
npm version patch
npm publish --access public --otp=123456
```

If you are prompted for the OTP, enter the code from your authenticator.

### Option 2: Publish from GitHub Actions

This repo includes a GitHub Actions workflow at `.github/workflows/publish.yml`.

1. Create an npm automation token on https://www.npmjs.com/
   - Go to Access Tokens
   - Create an automation token
   - Enable bypass for 2FA if your account requires it
2. Add the token to your repository secrets as `NPM_TOKEN`
3. Push a semantic version tag, for example:

```bash
git tag v1.0.1
git push origin v1.0.1
```

The workflow will run and publish the package automatically.
