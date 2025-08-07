import requests
import sys
import json
from datetime import datetime

class LaundryAPITester:
    def __init__(self, base_url="https://50e7adda-d8b7-463e-be3e-61bfd8b349db.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_booking_id = None
        self.available_machine_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: Found {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_get_machines(self):
        """Test getting all machines"""
        success, response = self.run_test(
            "Get All Machines",
            "GET",
            "machines",
            200
        )
        if success and response:
            # Find an available machine for booking tests
            for machine in response:
                if machine.get('status') == 'available':
                    self.available_machine_id = machine.get('id')
                    print(f"   Found available machine: {machine.get('machine_number')} (ID: {self.available_machine_id})")
                    break
        return success

    def test_get_machines_by_floor(self):
        """Test getting machines by floor"""
        success, response = self.run_test(
            "Get Machines by Floor 1",
            "GET",
            "machines/floor/1",
            200
        )
        return success

    def test_get_stats(self):
        """Test getting dashboard statistics"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "stats",
            200
        )
        if success and response:
            expected_keys = ['total_machines', 'available_machines', 'in_use_machines', 'out_of_order_machines', 'usage_rate']
            for key in expected_keys:
                if key not in response:
                    print(f"   Warning: Missing key '{key}' in stats response")
        return success

    def test_get_active_bookings(self):
        """Test getting active bookings"""
        success, response = self.run_test(
            "Get Active Bookings",
            "GET",
            "bookings/active",
            200
        )
        return success

    def test_create_booking(self):
        """Test creating a new booking"""
        if not self.available_machine_id:
            print("❌ Cannot test booking - no available machine found")
            return False

        booking_data = {
            "machine_id": self.available_machine_id,
            "student_name": "Test Student",
            "student_room": "A101",
            "duration": 60
        }

        success, response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            201,
            data=booking_data
        )
        
        if success and response:
            self.created_booking_id = response.get('id')
            print(f"   Created booking ID: {self.created_booking_id}")
        
        return success

    def test_get_machine_after_booking(self):
        """Test that machine status changed after booking"""
        if not self.available_machine_id:
            print("❌ Cannot test machine status - no machine ID available")
            return False

        success, response = self.run_test(
            "Get Machine After Booking",
            "GET",
            f"machines/{self.available_machine_id}",
            200
        )
        
        if success and response:
            if response.get('status') == 'in_use':
                print("   ✅ Machine status correctly changed to 'in_use'")
            else:
                print(f"   ❌ Machine status is '{response.get('status')}', expected 'in_use'")
        
        return success

    def test_update_machine_status(self):
        """Test updating machine status"""
        if not self.available_machine_id:
            print("❌ Cannot test machine update - no machine ID available")
            return False

        update_data = {
            "status": "out_of_order"
        }

        success, response = self.run_test(
            "Update Machine Status",
            "PUT",
            f"machines/{self.available_machine_id}",
            200,
            data=update_data
        )
        
        if success and response:
            if response.get('status') == 'out_of_order':
                print("   ✅ Machine status correctly updated to 'out_of_order'")
            else:
                print(f"   ❌ Machine status is '{response.get('status')}', expected 'out_of_order'")
        
        return success

    def test_complete_booking(self):
        """Test completing a booking"""
        if not self.created_booking_id:
            print("❌ Cannot test booking completion - no booking ID available")
            return False

        success, response = self.run_test(
            "Complete Booking",
            "PUT",
            f"bookings/{self.created_booking_id}/complete",
            200
        )
        
        return success

    def test_invalid_endpoints(self):
        """Test error handling for invalid requests"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid machine ID
        success1, _ = self.run_test(
            "Get Invalid Machine",
            "GET",
            "machines/invalid-id",
            404
        )
        
        # Test booking invalid machine
        success2, _ = self.run_test(
            "Book Invalid Machine",
            "POST",
            "bookings",
            404,
            data={
                "machine_id": "invalid-id",
                "student_name": "Test",
                "student_room": "A101",
                "duration": 60
            }
        )
        
        # Test completing invalid booking
        success3, _ = self.run_test(
            "Complete Invalid Booking",
            "PUT",
            "bookings/invalid-id/complete",
            404
        )
        
        return success1 and success2 and success3

def main():
    print("🚀 Starting Laundry Management System API Tests")
    print("=" * 60)
    
    tester = LaundryAPITester()
    
    # Run all tests in sequence
    test_results = []
    
    test_results.append(tester.test_get_machines())
    test_results.append(tester.test_get_machines_by_floor())
    test_results.append(tester.test_get_stats())
    test_results.append(tester.test_get_active_bookings())
    test_results.append(tester.test_create_booking())
    test_results.append(tester.test_get_machine_after_booking())
    test_results.append(tester.test_update_machine_status())
    test_results.append(tester.test_complete_booking())
    test_results.append(tester.test_invalid_endpoints())
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"❌ {failed_tests} test(s) failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())