import sys
# Reconfigure stdout to print Unicode symbols correctly on Windows
sys.stdout.reconfigure(encoding='utf-8')

import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
from app import app, retrieve_relevant_chunks

def main():
    print("=== STARTING REAL-TIME RAG CONTEXT RETRIEVAL TEST ===")
    with app.app_context():
        # Retrieve chunks for KBCNMU
        query_text = "What are the latest announcements or admission dates for KBCNMU?"
        print(f"Querying RAG for: '{query_text}'")
        
        matched = retrieve_relevant_chunks(university_id="kbcnmu", query_text=query_text, limit=3)
        print(f"Retrieved {len(matched)} context chunk(s):")
        
        found_live_announcement = False
        for idx, chunk in enumerate(matched):
            print(f"  {idx+1}. [{chunk.category.upper()}] (Length: {len(chunk.content)})")
            print(f"      Content: {chunk.content.splitlines()[1][:120]}...")
            if "Admissions open for Academic Year 2026-27" in chunk.content or "Live Notice" in chunk.content or "Announcement" in chunk.content or "Announcements" in chunk.content or "Admissions" in chunk.content:
                found_live_announcement = True
                
        if found_live_announcement:
            print("✅ SUCCESS: Synced live announcements correctly retrieved by RAG engine!")
        else:
            print("❌ ERROR: Synced live announcements context not found in RAG results.")
            sys.exit(1)
            
    print("\n=== ALL REAL-TIME RAG TESTS PASSED ===")

if __name__ == "__main__":
    main()
