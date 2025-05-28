---
title: Quick Start
description: Get up and running with our API in 5 minutes
---

# Quick Start Guide

This quick start guide will help you integrate our API into your application in just a few minutes.

## Prerequisites

Before you begin, make sure you have:

- An account on our platform
- A basic understanding of RESTful APIs
- Your favorite HTTP client (cURL, Postman, or your programming language's HTTP library)

## Step 1: Generate an API Key

Log in to the [Developer Portal](https://example.com/developer) and navigate to the API Keys section. Generate a new key
and save it securely.

## Step 2: Make Your First API Call

Here's how to make a simple API call to verify your setup:

```bash
curl -X GET "https://api.example.com/v3/status" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

You should receive a response like this:

```json
{
  "status": "operational",
  "version": "3.0.4",
  "timestamp": "2023-06-15T12:34:56Z"
}
```

## Step 3: Explore the API

Now that you've verified your setup, you can explore our different endpoints:

- `/users` - Manage user accounts
- `/products` - Access product information
- `/orders` - Create and manage orders

## Next Steps

- Explore the [API Reference](../api/core/core.md) for detailed endpoint documentation
- Check out our [Code Examples](../examples/authentication.md) for implementation samples
- Join our [Developer Community](https://community.example.com) for support
