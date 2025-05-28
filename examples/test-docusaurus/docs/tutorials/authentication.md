---
title: Authentication Tutorial
description: Learn how to authenticate with our API in multiple languages
---

# API Authentication Tutorial

This tutorial explains how to properly authenticate with our API across different programming languages and frameworks.

## Understanding Authentication Methods

Our API supports two authentication methods:

1. **API Key Authentication**: Simple method using an API key in the request header
2. **OAuth 2.0**: More secure method for third-party applications

## Method 1: API Key Authentication

API key authentication is the simplest method. You include your API key in the `Authorization` header with each request.

### Getting Your API Key

1. Log in to your account at [dashboard.example.com](https://dashboard.example.com)
2. Navigate to API Settings → API Keys
3. Generate a new API key
4. Store it securely - it will only be shown once!

### Implementation Examples

#### cURL

```bash
curl -X GET "https://api.example.com/v3/users" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

#### Python

```python
import requests

api_key = "YOUR_API_KEY"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get("https://api.example.com/v3/users", headers=headers)
print(response.json())
```

#### JavaScript

```javascript
const fetchUsers = async () => {
  const response = await fetch("https://api.example.com/v3/users", {
    method: "GET",
    headers: {
      Authorization: "Bearer YOUR_API_KEY",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log(data);
};

fetchUsers();
```

#### Java

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ApiExample {
    public static void main(String[] args) throws Exception {
        String apiKey = "YOUR_API_KEY";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.example.com/v3/users"))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println(response.body());
    }
}
```

## Method 2: OAuth 2.0 Authentication

OAuth 2.0 is recommended for applications acting on behalf of users.

### OAuth Flow

1. Register your application to get a client ID and secret
2. Redirect users to our authorization URL
3. User grants permission to your application
4. Our server redirects back to your application with an authorization code
5. Exchange the code for an access token
6. Use the access token for API requests

### Implementation Example

```javascript
// Step 1: Redirect user to authorization URL
const clientId = "YOUR_CLIENT_ID";
const redirectUri = "https://your-app.com/callback";
const authUrl = `https://auth.example.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

// After user authorizes and is redirected back to your app with a code:

// Step 2: Exchange code for token
const exchangeCodeForToken = async (code) => {
  const response = await fetch("https://auth.example.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: "YOUR_CLIENT_ID",
      client_secret: "YOUR_CLIENT_SECRET",
      code: code,
      redirect_uri: "https://your-app.com/callback",
      grant_type: "authorization_code",
    }),
  });

  const { access_token } = await response.json();
  return access_token;
};

// Step 3: Use the token for API requests
const fetchUserData = async (accessToken) => {
  const response = await fetch("https://api.example.com/v3/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
};
```

## Security Best Practices

- Never expose API keys in client-side code
- Use environment variables to store keys
- Implement token rotation for long-running applications
- Set appropriate scopes for OAuth tokens
- Use HTTPS for all API requests

## Troubleshooting

If you encounter authentication errors, check:

1. Your API key is valid and not expired
2. The API key has the correct permissions
3. You're including the key in the correct format
4. Your OAuth token has not expired

For more help, contact our [Developer Support](mailto:dev-support@example.com).
