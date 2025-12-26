"""
Download and process Nigerian Pidgin dataset for voice assistant training
"""
import kagglehub
import pandas as pd
import json
import os

# Download dataset
print("Downloading Nigerian Pidgin dataset...")
path = kagglehub.dataset_download("sllresearchgroup/nigerian-pidgin-english-dataset-with-5-emotion")
print(f"Dataset downloaded to: {path}")

# Find CSV files
csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
print(f"Found files: {csv_files}")

# Load and process dataset
pidgin_phrases = []
for csv_file in csv_files:
    df = pd.read_csv(os.path.join(path, csv_file))
    print(f"\nProcessing {csv_file}...")
    print(f"Columns: {df.columns.tolist()}")
    
    # Extract Pidgin phrases and their English translations
    for _, row in df.iterrows():
        if 'pidgin' in df.columns and 'english' in df.columns:
            pidgin_phrases.append({
                "pidgin": str(row['pidgin']),
                "english": str(row['english']),
                "emotion": str(row.get('emotion', 'neutral'))
            })

# Create training data structure
training_data = {
    "language": "Nigerian Pidgin",
    "total_phrases": len(pidgin_phrases),
    "common_phrases": pidgin_phrases[:100],  # Top 100 most common
    "financial_terms": [
        {"pidgin": "How my money dey?", "english": "What is my balance?"},
        {"pidgin": "I wan send money", "english": "I want to transfer money"},
        {"pidgin": "Abeg show me my account", "english": "Please show me my account"},
        {"pidgin": "Wetin be my balance?", "english": "What is my balance?"},
        {"pidgin": "I wan pay bill", "english": "I want to pay a bill"},
        {"pidgin": "Make I buy airtime", "english": "Let me buy airtime"},
        {"pidgin": "I wan withdraw money", "english": "I want to withdraw money"},
        {"pidgin": "Show me my transaction", "english": "Show me my transactions"},
    ]
}

# Save to JSON
output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'pidgin-training.json')
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(training_data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Training data saved to: {output_path}")
print(f"Total phrases: {len(pidgin_phrases)}")
