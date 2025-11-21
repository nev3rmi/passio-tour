#!/usr/bin/env python3
"""
Comprehensive Playwright Test Suite for Passio Tour Application
Tests all major pages and flows as specified in requirements
"""

from playwright.sync_api import sync_playwright, expect
import json
import time
from datetime import datetime

class PassioTourTester:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.screenshot_dir = "/home/nev3r/projects/passio-tour/.playwright-mcp"
        self.test_results = []
        self.screenshots_taken = []
        self.console_errors = []

    def log_test(self, test_name, status, details, screenshot_path=None):
        """Log test result"""
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "screenshot": screenshot_path
        }
        self.test_results.append(result)
        print(f"\n{'='*60}")
        print(f"TEST: {test_name}")
        print(f"STATUS: {status}")
        print(f"DETAILS: {details}")
        if screenshot_path:
            print(f"SCREENSHOT: {screenshot_path}")
            self.screenshots_taken.append(screenshot_path)
        print('='*60)

    def setup_console_listener(self, page):
        """Setup console error listener"""
        def handle_console(msg):
            if msg.type in ['error', 'warning']:
                error_msg = f"[{msg.type.upper()}] {msg.text}"
                self.console_errors.append(error_msg)
                print(f"Console {msg.type}: {msg.text}")

        page.on("console", handle_console)

    def test_homepage(self, page):
        """Test 1: Homepage Test"""
        print("\n\n🏠 TESTING HOMEPAGE...")
        try:
            # Navigate to homepage
            response = page.goto(self.base_url, wait_until="networkidle", timeout=10000)

            # Take screenshot
            screenshot_path = f"{self.screenshot_dir}/test_01_homepage.png"
            page.screenshot(path=screenshot_path, full_page=True)

            # Check response status
            if response.status != 200:
                self.log_test("Homepage Load", "FAILED",
                             f"HTTP status: {response.status}", screenshot_path)
                return

            # Verify navigation menu
            nav_present = page.locator("nav").count() > 0

            # Check for Sign In and Sign Up buttons
            sign_in_present = page.get_by_text("Sign In", exact=False).count() > 0
            sign_up_present = page.get_by_text("Sign Up", exact=False).count() > 0

            # Get page title
            title = page.title()

            details = f"Title: '{title}', Navigation: {nav_present}, Sign In button: {sign_in_present}, Sign Up button: {sign_up_present}"

            if nav_present or sign_in_present or sign_up_present:
                self.log_test("Homepage Test", "PASSED", details, screenshot_path)
            else:
                self.log_test("Homepage Test", "WARNING",
                             f"Missing expected elements. {details}", screenshot_path)

        except Exception as e:
            self.log_test("Homepage Test", "FAILED", f"Error: {str(e)}", screenshot_path)

    def test_login_flow(self, page):
        """Test 2: Login Flow Test"""
        print("\n\n🔐 TESTING LOGIN FLOW...")
        try:
            # Navigate to login page
            page.goto(f"{self.base_url}/login", wait_until="networkidle", timeout=10000)

            # Take screenshot of login page
            screenshot_path = f"{self.screenshot_dir}/test_02_login_page.png"
            page.screenshot(path=screenshot_path, full_page=True)
            self.log_test("Login Page Load", "PASSED", "Login page loaded", screenshot_path)

            # Wait a moment for page to stabilize
            page.wait_for_timeout(1000)

            # Try to find email input (try multiple selectors)
            email_input = None
            email_selectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[placeholder*="email" i]',
                'input[id*="email" i]'
            ]

            for selector in email_selectors:
                if page.locator(selector).count() > 0:
                    email_input = page.locator(selector).first
                    break

            # Try to find password input
            password_input = None
            password_selectors = [
                'input[type="password"]',
                'input[name="password"]',
                'input[placeholder*="password" i]',
                'input[id*="password" i]'
            ]

            for selector in password_selectors:
                if page.locator(selector).count() > 0:
                    password_input = page.locator(selector).first
                    break

            if not email_input or not password_input:
                self.log_test("Login Form Fill", "FAILED",
                             "Could not find email or password input fields")
                return

            # Fill in credentials
            email_input.fill("admin@passiotour.com")
            password_input.fill("Admin@123")

            # Take screenshot of filled form
            screenshot_path = f"{self.screenshot_dir}/test_03_login_filled.png"
            page.screenshot(path=screenshot_path, full_page=True)
            self.log_test("Login Form Fill", "PASSED", "Filled login credentials", screenshot_path)

            # Find and click Sign In button
            sign_in_button = None
            button_selectors = [
                'button:has-text("Sign In")',
                'button[type="submit"]',
                'button:has-text("Login")',
                'input[type="submit"]'
            ]

            for selector in button_selectors:
                if page.locator(selector).count() > 0:
                    sign_in_button = page.locator(selector).first
                    break

            if not sign_in_button:
                self.log_test("Login Submit", "FAILED", "Could not find Sign In button")
                return

            # Click sign in and wait for navigation
            current_url = page.url
            sign_in_button.click()

            # Wait for navigation or timeout
            try:
                page.wait_for_url(lambda url: url != current_url, timeout=5000)
            except:
                pass  # Continue even if no navigation

            page.wait_for_timeout(2000)

            # Take screenshot after login attempt
            screenshot_path = f"{self.screenshot_dir}/test_04_after_login.png"
            page.screenshot(path=screenshot_path, full_page=True)

            final_url = page.url
            if "login" not in final_url:
                self.log_test("Login Flow", "PASSED",
                             f"Successfully redirected to: {final_url}", screenshot_path)
            else:
                # Check for error messages
                error_visible = page.locator('[role="alert"]').count() > 0 or \
                               page.get_by_text("error", exact=False).count() > 0
                if error_visible:
                    error_text = page.locator('[role="alert"]').first.text_content() if page.locator('[role="alert"]').count() > 0 else "Unknown error"
                    self.log_test("Login Flow", "FAILED",
                                 f"Login failed: {error_text}", screenshot_path)
                else:
                    self.log_test("Login Flow", "WARNING",
                                 f"Still on login page: {final_url}", screenshot_path)

        except Exception as e:
            self.log_test("Login Flow Test", "FAILED", f"Error: {str(e)}")

    def test_dashboard(self, page):
        """Test 3: Dashboard Test"""
        print("\n\n📊 TESTING DASHBOARD...")
        try:
            # Navigate to dashboard
            response = page.goto(f"{self.base_url}/dashboard", wait_until="networkidle", timeout=10000)

            page.wait_for_timeout(1000)

            # Take screenshot
            screenshot_path = f"{self.screenshot_dir}/test_05_dashboard.png"
            page.screenshot(path=screenshot_path, full_page=True)

            current_url = page.url

            # Check if redirected to login (auth required)
            if "login" in current_url:
                self.log_test("Dashboard Test", "INFO",
                             "Dashboard requires authentication - redirected to login", screenshot_path)
            else:
                # Check for dashboard content
                has_content = len(page.content()) > 1000
                title = page.title()
                self.log_test("Dashboard Test", "PASSED",
                             f"Dashboard loaded. Title: '{title}', Content length: {len(page.content())} chars",
                             screenshot_path)

        except Exception as e:
            self.log_test("Dashboard Test", "FAILED", f"Error: {str(e)}")

    def test_tours_page(self, page):
        """Test 4: Tours Page Test"""
        print("\n\n🎫 TESTING TOURS PAGE...")
        try:
            # Navigate to tours page
            response = page.goto(f"{self.base_url}/tours", wait_until="networkidle", timeout=10000)

            page.wait_for_timeout(1000)

            # Take screenshot
            screenshot_path = f"{self.screenshot_dir}/test_06_tours.png"
            page.screenshot(path=screenshot_path, full_page=True)

            # Check response
            status = response.status if response else "No response"
            current_url = page.url
            title = page.title()

            # Check for errors in page
            error_visible = page.locator("text=/error|404|not found/i").count() > 0

            if error_visible:
                self.log_test("Tours Page Test", "FAILED",
                             f"Page shows error. Status: {status}", screenshot_path)
            elif status == 200 or status == "200":
                self.log_test("Tours Page Test", "PASSED",
                             f"Tours page loaded. Title: '{title}', URL: {current_url}", screenshot_path)
            else:
                self.log_test("Tours Page Test", "WARNING",
                             f"Status: {status}, URL: {current_url}", screenshot_path)

        except Exception as e:
            self.log_test("Tours Page Test", "FAILED", f"Error: {str(e)}")

    def test_static_pages(self, page):
        """Test 5: Static Pages Test"""
        print("\n\n📄 TESTING STATIC PAGES...")

        pages_to_test = [
            ("/about", "About"),
            ("/contact", "Contact"),
            ("/privacy", "Privacy"),
            ("/terms", "Terms"),
            ("/faq", "FAQ")
        ]

        pages_to_screenshot = ["/about", "/contact", "/faq"]

        for path, name in pages_to_test:
            try:
                response = page.goto(f"{self.base_url}{path}", wait_until="networkidle", timeout=10000)
                page.wait_for_timeout(500)

                status = response.status if response else "No response"
                current_url = page.url
                title = page.title()

                screenshot_path = None
                if path in pages_to_screenshot:
                    screenshot_path = f"{self.screenshot_dir}/test_07_static_{name.lower()}.png"
                    page.screenshot(path=screenshot_path, full_page=True)

                # Check for 404 or error
                is_404 = page.locator("text=/404|not found/i").count() > 0

                if is_404:
                    self.log_test(f"{name} Page", "WARNING",
                                 f"Page may not exist (404). URL: {current_url}", screenshot_path)
                elif status == 200 or status == "200":
                    self.log_test(f"{name} Page", "PASSED",
                                 f"Page loaded. Title: '{title}'", screenshot_path)
                else:
                    self.log_test(f"{name} Page", "WARNING",
                                 f"Status: {status}", screenshot_path)

            except Exception as e:
                self.log_test(f"{name} Page", "FAILED", f"Error: {str(e)}")

    def test_register_page(self, page):
        """Test 6: Register Page Test"""
        print("\n\n📝 TESTING REGISTER PAGE...")
        try:
            # Navigate to register page
            response = page.goto(f"{self.base_url}/register", wait_until="networkidle", timeout=10000)

            page.wait_for_timeout(1000)

            # Take screenshot
            screenshot_path = f"{self.screenshot_dir}/test_08_register.png"
            page.screenshot(path=screenshot_path, full_page=True)

            # Check for form presence
            form_present = page.locator("form").count() > 0
            input_fields = page.locator("input").count()
            title = page.title()

            details = f"Title: '{title}', Form present: {form_present}, Input fields: {input_fields}"

            if form_present and input_fields > 0:
                self.log_test("Register Page Test", "PASSED", details, screenshot_path)
            else:
                self.log_test("Register Page Test", "WARNING",
                             f"Form may be missing. {details}", screenshot_path)

        except Exception as e:
            self.log_test("Register Page Test", "FAILED", f"Error: {str(e)}")

    def generate_report(self):
        """Generate final test report"""
        print("\n\n" + "="*80)
        print(" PASSIO TOUR APPLICATION - COMPREHENSIVE TEST REPORT")
        print("="*80)

        total_tests = len(self.test_results)
        passed = len([t for t in self.test_results if t['status'] == 'PASSED'])
        failed = len([t for t in self.test_results if t['status'] == 'FAILED'])
        warnings = len([t for t in self.test_results if t['status'] in ['WARNING', 'INFO']])

        print(f"\n📊 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        print(f"   ⚠️  Warnings/Info: {warnings}")
        print(f"   📸 Screenshots: {len(self.screenshots_taken)}")
        print(f"   🐛 Console Errors: {len(self.console_errors)}")

        print(f"\n📝 DETAILED RESULTS:")
        for i, result in enumerate(self.test_results, 1):
            status_icon = "✅" if result['status'] == 'PASSED' else "❌" if result['status'] == 'FAILED' else "⚠️"
            print(f"\n{i}. {status_icon} {result['test_name']}")
            print(f"   Status: {result['status']}")
            print(f"   Details: {result['details']}")
            if result['screenshot']:
                print(f"   Screenshot: {result['screenshot']}")

        if self.console_errors:
            print(f"\n🐛 CONSOLE ERRORS/WARNINGS:")
            for i, error in enumerate(self.console_errors[:10], 1):  # Show first 10
                print(f"   {i}. {error}")
            if len(self.console_errors) > 10:
                print(f"   ... and {len(self.console_errors) - 10} more")

        print(f"\n📸 SCREENSHOTS TAKEN:")
        for screenshot in self.screenshots_taken:
            print(f"   - {screenshot}")

        # Overall status
        if failed == 0:
            print(f"\n✅ OVERALL STATUS: ALL TESTS PASSED")
        elif failed < total_tests / 2:
            print(f"\n⚠️  OVERALL STATUS: MOSTLY WORKING (some issues detected)")
        else:
            print(f"\n❌ OVERALL STATUS: SIGNIFICANT ISSUES DETECTED")

        print("\n" + "="*80)

        # Save JSON report
        report_path = f"{self.screenshot_dir}/test_report.json"
        with open(report_path, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_tests': total_tests,
                    'passed': passed,
                    'failed': failed,
                    'warnings': warnings,
                    'screenshots': len(self.screenshots_taken),
                    'console_errors': len(self.console_errors)
                },
                'test_results': self.test_results,
                'console_errors': self.console_errors,
                'screenshots': self.screenshots_taken
            }, f, indent=2)
        print(f"\n📄 Detailed JSON report saved to: {report_path}")

    def run_all_tests(self):
        """Run all tests"""
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            )
            page = context.new_page()

            # Setup console listener
            self.setup_console_listener(page)

            try:
                # Run all tests
                self.test_homepage(page)
                self.test_login_flow(page)
                self.test_dashboard(page)
                self.test_tours_page(page)
                self.test_static_pages(page)
                self.test_register_page(page)

            finally:
                # Cleanup
                context.close()
                browser.close()

            # Generate report
            self.generate_report()

if __name__ == "__main__":
    print("🚀 Starting Passio Tour Comprehensive Test Suite...")
    tester = PassioTourTester()
    tester.run_all_tests()
    print("\n✨ Test suite completed!")
