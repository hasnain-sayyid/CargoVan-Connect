import urllib.request
import json
import os

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/bookings/") as response:
        data = json.loads(response.read().decode())
        with open("api_response.json", "w") as f:
            json.dump(data, f, indent=2)
    print("API response saved to api_response.json")
except Exception as e:
    print(f"Error: {e}")
