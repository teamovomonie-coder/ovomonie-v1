# Voice Assistant Language Training

## Setup

### 1. Install Python Dependencies
```bash
cd scripts
pip install -r requirements.txt
```

### 2. Download Nigerian Pidgin Dataset
```bash
python download-pidgin-dataset.py
```

This will:
- Download the Nigerian Pidgin dataset from Kaggle
- Process and extract common phrases
- Generate training data in `src/data/pidgin-training.json`

### 3. Dataset Integration

The Pidgin context is automatically loaded into the AI assistant at:
- `src/data/pidgin-context.json` - Core Pidgin phrases and vocabulary
- `src/app/api/ai/assistant/route.ts` - AI system prompt with Pidgin support

## Supported Languages

1. **English** - Default
2. **Nigerian Pidgin** - Full support with dataset
3. **Yoruba** - Coming soon
4. **Igbo** - Coming soon
5. **Hausa** - Coming soon

## Adding More Languages

1. Create `src/data/{language}-context.json`
2. Add common phrases and financial terms
3. Import in `assistant/route.ts`
4. Update system prompt with language context

## Testing Pidgin Voice Assistant

Try these phrases:
- "How my money dey?" (Check balance)
- "I wan send money" (Transfer)
- "Wetin be my balance?" (Check balance)
- "Make I buy airtime" (Buy airtime)
- "Abeg show me my account" (View account)
