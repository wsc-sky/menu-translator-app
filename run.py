#!/usr/bin/env python3
"""
Simple script to run the Menu Translator web application
"""
import uvicorn
import os

if __name__ == "__main__":
    # Check if OpenAI API key is set in system environment
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print("✅ Using OpenAI API key from system environment variable")
    else:
        # Check if .env file exists
        if os.path.exists(".env"):
            print("📄 No system environment variable found, will use .env file")
        else:
            print("⚠️  Warning: OPENAI_API_KEY not found in system environment or .env file!")
            print("Please set your OpenAI API key:")
            print("  System environment: export OPENAI_API_KEY='your-api-key-here'")
            print("  Or create .env file with: OPENAI_API_KEY=your-api-key-here")
            print()
    
    # Run the application
    print("🚀 Starting Menu Translator...")
    print("📱 Open your browser to: http://localhost:8000")
    print("🛑 Press Ctrl+C to stop the server")
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
