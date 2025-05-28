---
title: Core API
description: Core API endpoints and functionality
---

# Core API Reference

The Core API provides the fundamental functionality of our platform. These endpoints are available in all API versions.

## Base URL

All API endpoints should be prefixed with the following base URL:

```
https://api.example.com/v3
```

## Authentication

All API requests require authentication. Include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Core Endpoints

### User Management

| Endpoint      | Method | Description         |
| ------------- | ------ | ------------------- |
| `/users`      | GET    | List all users      |
| `/users/{id}` | GET    | Get user details    |
| `/users`      | POST   | Create a new user   |
| `/users/{id}` | PUT    | Update user details |
| `/users/{id}` | DELETE | Delete a user       |

### Example Request

```javascript
// Get user details
const userId = "12345";
const response = await fetch(`https://api.example.com/v3/users/${userId}`, {
  method: "GET",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
});

const userData = await response.json();
console.log(userData);
```

## Rate Limiting

The API has a rate limit of 100 requests per minute per API key. If you exceed this limit, you'll receive a
`429 Too Many Requests` response.

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

Error responses include a JSON body with details about the error:

```json
{
  "error": {
    "code": "invalid_parameter",
    "message": "The provided user ID is not valid",
    "details": {
      "parameter": "user_id"
    }
  }
}
```
