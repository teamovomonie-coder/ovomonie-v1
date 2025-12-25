# Voice Assistant - Mobile Implementation Guide

## Web App (Current - Already Implemented)
✅ **Header Mic Icon** - Located in top navigation bar
✅ **AI Assistant Page** - Full chat interface at `/ai-assistant`
✅ **Voice Recognition** - Web Speech API
✅ **Voice Response** - Browser TTS (Nigerian English)

## Mobile App (React Native - To Be Implemented)

### Floating Voice Assistant (Like AnyDesk AD-1)

**Required Packages:**
```bash
npm install react-native-floating-bubble
npm install @react-native-voice/voice
npm install react-native-sound
npm install react-native-biometrics
```

**Implementation:**

```javascript
// FloatingVoiceAssistant.tsx (React Native)
import FloatingBubble from 'react-native-floating-bubble';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import ReactNativeBiometrics from 'react-native-biometrics';

export const FloatingVoiceAssistant = () => {
  // Same logic as web version but with:
  // - FloatingBubble for overlay
  // - Voice for speech recognition
  // - Sound for audio playback
  // - ReactNativeBiometrics for PIN/fingerprint
  
  return (
    <FloatingBubble
      icon={require('./assets/mic-icon.png')}
      onPress={handleVoiceInput}
      position={{ x: 20, y: 60 }}
    />
  );
};
```

**Features:**
- System-level overlay (works outside app)
- Draggable bubble
- Voice-to-voice conversation
- PIN/biometric security gate
- Continuous listening
- All 5 Nigerian languages

**API Endpoints (Already Built):**
- `/api/ai/assistant` - AI processing
- `/api/ai/text-to-speech` - Voice output
- `/api/auth/verify-pin` - Security verification

**Setup in React Native:**
1. Request overlay permission (Android)
2. Initialize FloatingBubble service
3. Connect to same backend APIs
4. Use native voice recognition
5. Play audio responses

The backend is ready - just need to build the React Native UI!
