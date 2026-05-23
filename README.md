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
