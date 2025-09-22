#!/usr/bin/env python3
"""
Test script for the Manual RAG system.

This script demonstrates how to use the specialized manual Q&A system
with sample manual content.
"""

import asyncio
import tempfile
import os
from pathlib import Path

# Add the project root to Python path
import sys
sys.path.append('/root/py/The-AI-Engineer-Challenge')

from aimakerspace.manual_rag import ManualRAGSystem, ManualParser
from aimakerspace.openai_utils.embedding import EmbeddingModel

async def test_manual_rag():
    """Test the manual RAG system with sample content."""
    
    print("🔧 Testing Manual RAG System")
    print("=" * 50)
    
    # Create sample manual content
    sample_manual = """
    USER MANUAL - Smart Thermostat Model ST-200

    TABLE OF CONTENTS
    1. Installation
    2. Initial Setup
    3. Daily Operation
    4. Troubleshooting
    5. Technical Specifications

    CHAPTER 1: INSTALLATION

    Before you begin:
    - Turn off power to your HVAC system
    - Remove the old thermostat
    - Check that you have the required tools

    Installation Steps:
    1. Turn off the power to your HVAC system at the circuit breaker
    2. Remove the old thermostat from the wall
    3. Disconnect the wires from the old thermostat
    4. Install the mounting plate for the new thermostat
    5. Connect the wires to the new thermostat according to the wiring diagram
    6. Attach the thermostat to the mounting plate
    7. Turn the power back on

    CHAPTER 2: INITIAL SETUP

    First Time Setup:
    1. Press and hold the Menu button for 3 seconds
    2. Select your language from the list
    3. Set the current date and time
    4. Connect to your WiFi network
    5. Create a user account in the mobile app
    6. Follow the guided setup wizard

    CHAPTER 3: DAILY OPERATION

    Setting Temperature:
    - Use the up/down arrows to adjust temperature
    - Press the Mode button to switch between Heat, Cool, and Auto
    - Press the Fan button to control fan operation

    Programming Schedule:
    1. Press the Schedule button
    2. Select the day you want to program
    3. Set the desired temperature for each time period
    4. Repeat for all days of the week
    5. Press Save to store your schedule

    CHAPTER 4: TROUBLESHOOTING

    Common Issues and Solutions:

    Problem: Thermostat not responding
    Solution: Check that the power is on and the display is lit. If not, check the circuit breaker.

    Problem: WiFi connection lost
    Solution: Go to Settings > WiFi and reconnect to your network. Check that your router is working.

    Problem: Temperature reading seems wrong
    Solution: Make sure the thermostat is not in direct sunlight or near heat sources. Check the sensor calibration in Settings.

    Problem: HVAC system not turning on
    Solution: Check the wiring connections. Make sure all wires are properly connected according to the wiring diagram.

    CHAPTER 5: TECHNICAL SPECIFICATIONS

    Power Requirements: 24V AC or 4 AA batteries
    Operating Temperature: 32°F to 104°F (0°C to 40°C)
    WiFi: 802.11 b/g/n
    Display: 3.5" color touchscreen
    Dimensions: 4.5" x 3.5" x 1"
    Warranty: 2 years from date of purchase

    Wiring Diagram:
    R - Red wire (24V power)
    W - White wire (Heat)
    Y - Yellow wire (Cool)
    G - Green wire (Fan)
    C - Blue wire (Common)
    """
    
    # Create a temporary PDF file (simulated)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(sample_manual)
        temp_file = f.name
    
    try:
        # Initialize the manual RAG system
        print("📚 Initializing Manual RAG System...")
        manual_rag = ManualRAGSystem()
        
        # Load the manual
        print("📖 Loading sample manual...")
        result = await manual_rag.load_manual(temp_file, "test_manual")
        print(f"✅ Loaded manual with {result['total_chunks']} chunks and {result['sections_count']} sections")
        
        # Test queries
        test_queries = [
            "How do I install the thermostat?",
            "What should I do if the thermostat is not responding?",
            "What are the technical specifications?",
            "How do I set up a schedule?",
            "What wires do I need to connect?"
        ]
        
        print("\n🔍 Testing Manual Q&A:")
        print("-" * 30)
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n{i}. Question: {query}")
            
            # Search for relevant chunks
            relevant_chunks = manual_rag.search_manual(query, "test_manual", k=3)
            
            if relevant_chunks:
                print("   📄 Relevant sections found:")
                for chunk in relevant_chunks:
                    print(f"      - {chunk['title']} ({chunk['section_type']}) - Similarity: {chunk.get('similarity', 0):.3f}")
                    print(f"        Preview: {chunk['content'][:100]}...")
            else:
                print("   ❌ No relevant sections found")
        
        print("\n✅ Manual RAG system test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing manual RAG system: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up
        if os.path.exists(temp_file):
            os.unlink(temp_file)

if __name__ == "__main__":
    asyncio.run(test_manual_rag())
