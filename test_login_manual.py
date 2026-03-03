import urllib.request
import urllib.error
import json

url = "http://localhost:8000/api/users/token/"
data = {
    "email": "teme19@gmail.com",
    "password": "12345678"
}

try:
    print(f"Attempting login for {data['email']}...")
    json_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'}, method='POST')
    
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        print(f"Status Code: {status_code}")
        response_body = response.read().decode('utf-8')
        if status_code == 200:
            print("Login Successful!")
            print("Response:", json.dumps(json.loads(response_body), indent=2))
        else:
            print("Login Failed.")
            print("Response:", response_body)

except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print("Response:", e.read().decode('utf-8'))
except urllib.error.URLError as e:
    print(f"Connection Error: {e.reason}")
    print("Is the backend server running at http://localhost:8000?")
except Exception as e:
    print(f"An error occurred: {e}")
