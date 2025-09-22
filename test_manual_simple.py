#!/usr/bin/env python3
"""
Simple test for the Manual RAG system components.

This script tests the core functionality without requiring external dependencies.
"""

import sys
sys.path.append('/root/py/The-AI-Engineer-Challenge')

def test_manual_parser():
    """Test the manual parser with sample content."""
    print("🔧 Testing Manual Parser")
    print("=" * 30)
    
    try:
        from aimakerspace.manual_rag import ManualParser
        
        # Create sample manual content
        sample_content = """
        USER MANUAL - Smart Thermostat Model ST-200

        CHAPTER 1: INSTALLATION

        Before you begin:
        - Turn off power to your HVAC system
        - Remove the old thermostat

        Installation Steps:
        1. Turn off the power to your HVAC system
        2. Remove the old thermostat from the wall
        3. Connect the wires to the new thermostat

        CHAPTER 2: TROUBLESHOOTING

        Common Issues:
        Problem: Thermostat not responding
        Solution: Check that the power is on

        Problem: WiFi connection lost
        Solution: Go to Settings > WiFi and reconnect
        """
        
        # Test the parser
        parser = ManualParser(chunk_size=200, chunk_overlap=50)
        
        # Test section detection
        test_lines = [
            "CHAPTER 1: INSTALLATION",
            "Installation Steps:",
            "Problem: Thermostat not responding",
            "Regular text line"
        ]
        
        print("Testing section header detection:")
        for line in test_lines:
            section = parser._is_section_header(line)
            print(f"  '{line}' -> {section}")
        
        # Test section classification
        print("\nTesting section classification:")
        test_sections = [
            ("Installation", ["Installation Steps:", "1. Turn off power"]),
            ("Troubleshooting", ["Problem: Thermostat not responding", "Solution: Check power"]),
            ("Specifications", ["Power: 24V", "Temperature: 32-104°F"])
        ]
        
        for title, content in test_sections:
            section_type = parser._classify_section(title, content)
            print(f"  '{title}' -> {section_type}")
        
        print("✅ Manual parser test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing manual parser: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_structure():
    """Test that the API structure is correct."""
    print("\n🔧 Testing API Structure")
    print("=" * 30)
    
    try:
        # Check if the manual API file exists and has the right structure
        api_file = "/root/py/The-AI-Engineer-Challenge/api/manual_app.py"
        
        with open(api_file, 'r') as f:
            content = f.read()
        
        # Check for key components
        checks = [
            ("FastAPI app", "app = FastAPI" in content),
            ("Upload endpoint", "/api/upload-manual" in content),
            ("Query endpoint", "/api/query-manual" in content),
            ("Streaming endpoint", "/api/query-manual-stream" in content),
            ("Manual RAG import", "from aimakerspace.manual_rag import ManualRAGSystem" in content)
        ]
        
        print("API Structure Checks:")
        all_passed = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"  {status} {check_name}")
            if not passed:
                all_passed = False
        
        if all_passed:
            print("✅ API structure test completed successfully!")
        else:
            print("❌ Some API structure checks failed")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error testing API structure: {e}")
        return False

def test_frontend_structure():
    """Test that the frontend structure is correct."""
    print("\n🔧 Testing Frontend Structure")
    print("=" * 30)
    
    try:
        import os
        frontend_dir = "/root/py/The-AI-Engineer-Challenge/frontend"
        
        # Check for key files
        files_to_check = [
            "package.json",
            "next.config.js",
            "tailwind.config.js",
            "app/layout.tsx",
            "app/page.tsx",
            "app/components/ManualUpload.tsx",
            "app/components/ManualList.tsx",
            "app/components/ManualQuery.tsx"
        ]
        
        print("Frontend Structure Checks:")
        all_passed = True
        for file_path in files_to_check:
            full_path = f"{frontend_dir}/{file_path}"
            exists = os.path.exists(full_path)
            status = "✅" if exists else "❌"
            print(f"  {status} {file_path}")
            if not exists:
                all_passed = False
        
        if all_passed:
            print("✅ Frontend structure test completed successfully!")
        else:
            print("❌ Some frontend structure checks failed")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error testing frontend structure: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Manual RAG System - Component Tests")
    print("=" * 50)
    
    import os
    
    tests = [
        test_manual_parser,
        test_api_structure,
        test_frontend_structure
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    print("\n📊 Test Summary")
    print("=" * 20)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The Manual RAG system is ready.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()
