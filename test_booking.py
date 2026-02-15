
import urllib.request
import json
import ssl

url = "http://localhost:8000/bookings/"
payload = {
    "user_id": 1,
    "van_id": 1,
    "status": "pending",
    "pickup_location": "NYC",
    "dropoff_location": "JFK",
    "scheduled_time": "2023-10-27T10:00:00",
    "van_size": "small",
    "time_slot": "8-10",
    "distance": "10.5",
    "duration_minutes": 30,
    "toll": 15.0
}
headers = {
    "Content-Type": "application/json"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data, headers)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
