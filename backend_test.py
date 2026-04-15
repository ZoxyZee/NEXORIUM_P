#!/usr/bin/env python3

import requests
import sys
import json
import io
from datetime import datetime

class NexoriumAuthAPITester:
    def __init__(self, base_url="https://ownership-vault.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user1_token = None
        self.user2_token = None
        self.new_user_token = None
        self.user1_asset_id = None
        self.user2_asset_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        request_headers = {}
        
        # Add auth headers if provided
        if headers:
            request_headers.update(headers)
        
        # Don't set Content-Type for multipart uploads
        if not files and 'Content-Type' not in request_headers:
            request_headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, params=params)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart
                    request_headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=request_headers)
                else:
                    response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=request_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
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

    # ===== AUTH TESTS =====
    
    def test_login_user1(self):
        """Test POST /api/auth/login with user1@nexorium.com / 123456"""
        success, response = self.run_test(
            "Login User1 (user1@nexorium.com)",
            "POST",
            "auth/login",
            200,
            data={"email": "user1@nexorium.com", "password": "123456"}
        )
        
        if success:
            if 'token' not in response:
                print(f"❌ Missing token in login response")
                return False
            self.user1_token = response['token']
            print(f"   User: {response.get('name')} ({response.get('email')})")
            print(f"   Token: {self.user1_token[:20]}...")
            
        return success

    def test_login_user2(self):
        """Test POST /api/auth/login with user2@nexorium.com / 123456"""
        success, response = self.run_test(
            "Login User2 (user2@nexorium.com)",
            "POST",
            "auth/login",
            200,
            data={"email": "user2@nexorium.com", "password": "123456"}
        )
        
        if success:
            if 'token' not in response:
                print(f"❌ Missing token in login response")
                return False
            self.user2_token = response['token']
            print(f"   User: {response.get('name')} ({response.get('email')})")
            print(f"   Token: {self.user2_token[:20]}...")
            
        return success

    def test_login_wrong_password(self):
        """Test POST /api/auth/login with wrong password returns 401"""
        success, response = self.run_test(
            "Login with Wrong Password",
            "POST",
            "auth/login",
            401,
            data={"email": "user1@nexorium.com", "password": "wrongpassword"}
        )
        return success

    def test_register_new_user(self):
        """Test POST /api/auth/register creates new user and returns token"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"testuser{timestamp}@nexorium.com"
        
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "testpass123", "name": "Test User"}
        )
        
        if success:
            if 'token' not in response:
                print(f"❌ Missing token in register response")
                return False
            self.new_user_token = response['token']
            print(f"   New User: {response.get('name')} ({response.get('email')})")
            print(f"   Token: {self.new_user_token[:20]}...")
            
        return success

    def test_get_me_with_token(self):
        """Test GET /api/auth/me with valid token returns user info"""
        if not self.user1_token:
            print("⚠️  Skipping - no user1 token available")
            return True
            
        success, response = self.run_test(
            "Get Current User (with token)",
            "GET",
            "auth/me",
            200,
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        if success:
            required_fields = ['id', 'email', 'name']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            print(f"   User Info: {response.get('name')} ({response.get('email')})")
            
        return success

    def test_get_me_without_token(self):
        """Test GET /api/auth/me without token returns 401"""
        success, response = self.run_test(
            "Get Current User (without token)",
            "GET",
            "auth/me",
            401
        )
        return success

    # ===== PROTECTED ENDPOINT TESTS =====
    
    def test_stats_requires_auth(self):
        """Test GET /api/stats requires auth token"""
        # First test without token (should fail)
        success_no_auth, _ = self.run_test(
            "Stats without Auth",
            "GET",
            "stats",
            401
        )
        
        if not success_no_auth:
            return False
            
        # Then test with token (should succeed)
        if not self.user1_token:
            print("⚠️  Skipping auth test - no user1 token available")
            return True
            
        success_with_auth, response = self.run_test(
            "Stats with Auth",
            "GET",
            "stats",
            200,
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        if success_with_auth:
            required_fields = ['totalAssets', 'totalNFTs', 'processing']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            print(f"   Stats: {response['totalAssets']} assets, {response['totalNFTs']} NFTs")
            
        return success_with_auth

    def test_assets_requires_auth(self):
        """Test GET /api/assets requires auth token"""
        # First test without token (should fail)
        success_no_auth, _ = self.run_test(
            "Assets without Auth",
            "GET",
            "assets",
            401
        )
        
        if not success_no_auth:
            return False
            
        # Then test with token (should succeed)
        if not self.user1_token:
            print("⚠️  Skipping auth test - no user1 token available")
            return True
            
        success_with_auth, response = self.run_test(
            "Assets with Auth",
            "GET",
            "assets",
            200,
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        if success_with_auth and isinstance(response, list):
            print(f"   Found {len(response)} assets for user1")
            
        return success_with_auth

    # ===== ASSET UPLOAD TESTS =====
    
    def test_upload_asset_user1(self):
        """Test POST /api/assets/upload with auth creates asset owned by logged-in user"""
        if not self.user1_token:
            print("⚠️  Skipping - no user1 token available")
            return True
            
        # Create a test file
        test_content = b"This is user1's test file for Nexorium testing"
        test_file = io.BytesIO(test_content)
        test_file.name = "user1_test_document.txt"
        
        files = {'file': ('user1_test_document.txt', test_file, 'text/plain')}
        data = {'walletAddress': '0x1111111111111111111111111111111111111111'}
        
        success, response = self.run_test(
            "Upload Asset (User1)",
            "POST",
            "assets/upload",
            200,
            data=data,
            files=files,
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        if success:
            required_fields = ['id', 'fileName', 'fileHash', 'nftId', 'owner', 'status']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            
            self.user1_asset_id = response['id']
            print(f"   Asset ID: {response['id']}")
            print(f"   Owner: {response['owner']}")
            print(f"   NFT ID: {response['nftId']}")
            
        return success

    def test_upload_asset_user2(self):
        """Test POST /api/assets/upload with user2 creates separate asset"""
        if not self.user2_token:
            print("⚠️  Skipping - no user2 token available")
            return True
            
        # Create a test file
        test_content = b"This is user2's test file for Nexorium testing"
        test_file = io.BytesIO(test_content)
        test_file.name = "user2_test_document.txt"
        
        files = {'file': ('user2_test_document.txt', test_file, 'text/plain')}
        data = {'walletAddress': '0x2222222222222222222222222222222222222222'}
        
        success, response = self.run_test(
            "Upload Asset (User2)",
            "POST",
            "assets/upload",
            200,
            data=data,
            files=files,
            headers={"Authorization": f"Bearer {self.user2_token}"}
        )
        
        if success:
            self.user2_asset_id = response['id']
            print(f"   Asset ID: {response['id']}")
            print(f"   Owner: {response['owner']}")
            print(f"   NFT ID: {response['nftId']}")
            
        return success

    # ===== USER ISOLATION TESTS =====
    
    def test_user_asset_isolation(self):
        """Test GET /api/assets only returns current user's assets (user isolation)"""
        if not self.user1_token or not self.user2_token:
            print("⚠️  Skipping - need both user tokens")
            return True
            
        # Get user1's assets
        success1, user1_assets = self.run_test(
            "User1 Assets (Isolation Test)",
            "GET",
            "assets",
            200,
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        if not success1:
            return False
            
        # Get user2's assets
        success2, user2_assets = self.run_test(
            "User2 Assets (Isolation Test)",
            "GET",
            "assets",
            200,
            headers={"Authorization": f"Bearer {self.user2_token}"}
        )
        
        if not success2:
            return False
            
        # Check that user1 can't see user2's assets and vice versa
        user1_asset_ids = [asset['id'] for asset in user1_assets]
        user2_asset_ids = [asset['id'] for asset in user2_assets]
        
        if self.user1_asset_id and self.user1_asset_id not in user1_asset_ids:
            print(f"❌ User1's asset not found in user1's asset list")
            return False
            
        if self.user2_asset_id and self.user2_asset_id not in user2_asset_ids:
            print(f"❌ User2's asset not found in user2's asset list")
            return False
            
        if self.user1_asset_id and self.user1_asset_id in user2_asset_ids:
            print(f"❌ User1's asset found in user2's asset list (isolation broken)")
            return False
            
        if self.user2_asset_id and self.user2_asset_id in user1_asset_ids:
            print(f"❌ User2's asset found in user1's asset list (isolation broken)")
            return False
            
        print(f"   User1 has {len(user1_assets)} assets, User2 has {len(user2_assets)} assets")
        print(f"   ✅ User isolation working correctly")
        
        return True

    # ===== CROSS-USER VERIFICATION TESTS =====
    
    def test_cross_user_verification(self):
        """Test POST /api/verify can find assets from any user (cross-user verification)"""
        if not self.user1_token or not self.user2_token:
            print("⚠️  Skipping - need both user tokens")
            return True
            
        # First, get user1's asset details
        success1, user1_assets = self.run_test(
            "Get User1 Assets for Verification",
            "GET",
            "assets",
            200,
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        if not success1 or not user1_assets:
            print("⚠️  No user1 assets to verify")
            return True
            
        user1_asset = user1_assets[0]
        user1_file_hash = user1_asset['fileHash']
        
        # Now verify user1's asset using user2's token (cross-user verification)
        success2, response = self.run_test(
            "Cross-User Verification (User2 verifying User1's asset)",
            "POST",
            "verify",
            200,
            data={'query': user1_file_hash},
            headers={"Authorization": f"Bearer {self.user2_token}"}
        )
        
        if success2:
            if not response.get('verified'):
                print(f"❌ Expected verified=True for cross-user verification")
                return False
            if 'asset' not in response:
                print(f"❌ Missing asset data in verification response")
                return False
            print(f"   ✅ Cross-user verification working: User2 can verify User1's asset")
            print(f"   Verified asset: {response['asset']['fileName']}")
            
        return success2

def main():
    print("🚀 Starting Nexorium Backend API Tests with Authentication")
    print("=" * 60)
    
    tester = NexoriumAuthAPITester()
    
    # Run all tests in sequence
    tests = [
        # Auth tests
        tester.test_login_user1,
        tester.test_login_user2,
        tester.test_login_wrong_password,
        tester.test_register_new_user,
        tester.test_get_me_with_token,
        tester.test_get_me_without_token,
        
        # Protected endpoint tests
        tester.test_stats_requires_auth,
        tester.test_assets_requires_auth,
        
        # Asset upload tests
        tester.test_upload_asset_user1,
        tester.test_upload_asset_user2,
        
        # User isolation tests
        tester.test_user_asset_isolation,
        
        # Cross-user verification tests
        tester.test_cross_user_verification,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend API tests passed!")
        return 0
    else:
        print("⚠️  Some backend API tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())