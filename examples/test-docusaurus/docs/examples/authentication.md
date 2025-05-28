---
title: Authentication Examples
description: Code examples for authenticating with the API in different languages
---

# Authentication Code Examples

This page provides code examples for authenticating with our API in various programming languages.

## API Key Authentication

### Node.js

```javascript
const axios = require("axios");

const API_KEY = "your_api_key_here";

async function fetchData() {
  try {
    const response = await axios.get("https://api.example.com/v3/data", {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Data retrieved:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error.response?.data || error.message);
    throw error;
  }
}

fetchData();
```

### Python

```python
import requests

API_KEY = 'your_api_key_here'

def fetch_data():
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    response = requests.get('https://api.example.com/v3/data', headers=headers)

    # Check for successful response
    response.raise_for_status()

    data = response.json()
    print('Data retrieved:', data)
    return data

if __name__ == '__main__':
    try:
        fetch_data()
    except requests.exceptions.HTTPError as err:
        print(f'HTTP Error: {err}')
    except Exception as err:
        print(f'Error: {err}')
```

### Go

```go
package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

const apiKey = "your_api_key_here"

func fetchData() (map[string]interface{}, error) {
	// Create request
	req, err := http.NewRequest("GET", "https://api.example.com/v3/data", nil)
	if err != nil {
		return nil, err
	}

	// Add headers
	req.Header.Add("Authorization", "Bearer "+apiKey)
	req.Header.Add("Content-Type", "application/json")

	// Make request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status code %d: %s", resp.StatusCode, string(body))
	}

	// Parse JSON response
	var data map[string]interface{}
	err = json.Unmarshal(body, &data)
	if err != nil {
		return nil, err
	}

	fmt.Println("Data retrieved:", data)
	return data, nil
}

func main() {
	_, err := fetchData()
	if err != nil {
		fmt.Println("Error:", err)
	}
}
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

API_KEY = 'your_api_key_here'

def fetch_data
  # Create URI and request
  uri = URI.parse('https://api.example.com/v3/data')
  request = Net::HTTP::Get.new(uri)

  # Set headers
  request['Authorization'] = "Bearer #{API_KEY}"
  request['Content-Type'] = 'application/json'

  # Make request
  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
    http.request(request)
  end

  # Parse response
  if response.code.to_i == 200
    data = JSON.parse(response.body)
    puts "Data retrieved: #{data}"
    return data
  else
    raise "API returned status code #{response.code}: #{response.body}"
  end
end

begin
  fetch_data
rescue => e
  puts "Error: #{e.message}"
end
```

## OAuth 2.0 Authentication

### Node.js OAuth Flow

```javascript
const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

// OAuth configuration
const clientId = "your_client_id";
const clientSecret = "your_client_secret";
const redirectUri = "http://localhost:3000/callback";
const authUrl = "https://auth.example.com/oauth/authorize";
const tokenUrl = "https://auth.example.com/oauth/token";

// Start OAuth flow
app.get("/login", (req, res) => {
  const authorizationUrl = `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  res.redirect(authorizationUrl);
});

// Handle callback from OAuth provider
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code not received");
  }

  try {
    // Exchange code for token
    const response = await axios.post(
      tokenUrl,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const accessToken = response.data.access_token;

    // Use the token to make an API request
    const apiResponse = await axios.get("https://api.example.com/v3/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(apiResponse.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).send("Error exchanging code for token");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

### Python OAuth Flow

```python
import requests
from flask import Flask, redirect, request, jsonify

app = Flask(__name__)

# OAuth configuration
CLIENT_ID = 'your_client_id'
CLIENT_SECRET = 'your_client_secret'
REDIRECT_URI = 'http://localhost:5000/callback'
AUTH_URL = 'https://auth.example.com/oauth/authorize'
TOKEN_URL = 'https://auth.example.com/oauth/token'

@app.route('/login')
def login():
    # Start OAuth flow
    auth_url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    # Get authorization code from callback
    code = request.args.get('code')

    if not code:
        return 'Authorization code not received', 400

    try:
        # Exchange code for token
        token_data = {
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'authorization_code'
        }

        token_response = requests.post(TOKEN_URL, json=token_data)
        token_response.raise_for_status()

        access_token = token_response.json()['access_token']

        # Use the token to make an API request
        api_response = requests.get(
            'https://api.example.com/v3/user',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        api_response.raise_for_status()

        return jsonify(api_response.json())

    except requests.exceptions.RequestException as e:
        return f'Error: {str(e)}', 500

if __name__ == '__main__':
    app.run(port=5000)
```

## Handling Authentication Errors

### Common Error Responses

```json
// Invalid API Key
{
  "error": {
    "code": "invalid_key",
    "message": "The API key provided is invalid or has been revoked."
  }
}

// Expired Token
{
  "error": {
    "code": "token_expired",
    "message": "The access token has expired."
  }
}

// Insufficient Permissions
{
  "error": {
    "code": "insufficient_permissions",
    "message": "The authenticated user does not have permission to access this resource."
  }
}
```

### Error Handling Example (Node.js)

```javascript
async function makeApiRequest(endpoint, accessToken) {
  try {
    const response = await axios.get(`https://api.example.com/v3/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        if (data.error?.code === "token_expired") {
          // Handle expired token
          const newToken = await refreshToken();
          return makeApiRequest(endpoint, newToken);
        } else {
          // Handle other authentication errors
          throw new Error(`Authentication error: ${data.error?.message || "Unknown error"}`);
        }
      } else if (status === 403) {
        // Handle permission errors
        throw new Error(`Permission denied: ${data.error?.message || "Insufficient permissions"}`);
      } else {
        // Handle other API errors
        throw new Error(`API error (${status}): ${data.error?.message || "Unknown error"}`);
      }
    } else {
      // Handle network errors
      throw new Error(`Network error: ${error.message}`);
    }
  }
}
```

These examples should help you get started with authenticating to our API using different programming languages and
approaches.
