# 🌱 EcoRoute - Sustainable AI Assistant

EcoRoute is a mobile AI chatbot application that prioritizes environmental sustainability by intelligently routing queries through rule-based responses, local AI models, and cloud AI only when necessary. The app also features barcode scanning for product information and eco-scoring.

## 📱 Features

- **Hybrid AI System**: Three-tier approach to minimize environmental impact
  - Rule-based responses for simple queries
  - Local AI (Microsoft Phi-2) for moderate complexity
  - Cloud AI (via OpenRouter) for complex tasks
- **Barcode Scanner**: Scan product barcodes to get nutritional info and eco-scores
- **User Authentication**: Secure Firebase-based authentication system
- **Environmental Tracking**: Real-time CO₂, water, and token usage statistics
- **Cross-Platform**: Built with React Native and Expo for iOS and Android

---

## 🛠️ Technologies Used

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile app framework |
| **Expo** | Development platform and tooling |
| **JavaScript/JSX** | Programming language |
| **Axios** | HTTP client for API requests |
| **AsyncStorage** | Local data persistence |
| **expo-camera** | Barcode scanning functionality |

### **Backend**
| Technology | Purpose |
|------------|---------|
| **Python** | Backend programming language |
| **Flask** | Web framework for REST API |
| **Flask-CORS** | Cross-Origin Resource Sharing |

### **AI/Machine Learning**
| Technology | Purpose |
|------------|---------|
| **Transformers** (HuggingFace) | NLP model loading and inference |
| **PyTorch** | Deep learning framework |
| **ONNX Runtime** | Optimized model inference |
| **Microsoft Phi-2** | Local language model |

### **Cloud Services & APIs**
| Service | Purpose |
|----------|---------|
| **Firebase Authentication** | User authentication and management |
| **OpenRouter API** | Cloud-based AI inference (fallback) |
| **Open Food Facts API** | Product barcode data lookup |

### **Development Tools**
- **Git** - Version control
- **npm/npx** - Package management
- **Python pip** - Python package management

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **Expo CLI** - Install with `npm install -g expo-cli`
- **Expo Go App** (on your mobile device) - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## 🚀 Installation

### 1️⃣ Clone the Repository
```bash
git clone <your-repo-url>
cd EcoRoute
```

### 2️⃣ Backend Setup

#### Install Python Dependencies
```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required packages
pip install flask flask-cors transformers torch optimum[onnxruntime] requests
```

#### Configure API Keys
1. Open `local.py`
2. Replace the OpenRouter API key:
```python
OPENROUTER_API_KEY = "your-openrouter-api-key-here"
```
> **Note**: Get your free API key at [OpenRouter](https://openrouter.ai/)

### 3️⃣ Frontend Setup

#### Install Node Modules
```bash
npm install
```

#### Install Expo Dependencies
```bash
npx expo install expo-camera @react-native-async-storage/async-storage axios
```

#### Configure Firebase
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Create a `firebase.js` file in the root directory:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### Configure Backend URL
Create a `config.js` file:
```javascript
export const API_BASE_URL = 'http://YOUR-IP-ADDRESS:8000';
// Example: 'http://192.168.1.100:8000'
```
> **Important**: Replace `YOUR-IP-ADDRESS` with your computer's local IP address

---

## 🎮 Running the Application

### Start the Backend Server

```bash
# Make sure virtual environment is activated
python local.py server
```

The server will start on `http://0.0.0.0:8000`

You should see:
```
🌐 Starting EcoAI Flask server...
📡 Endpoints:
   POST /chat - Send chat messages
   GET /stats - Get environmental impact stats
   GET /health - Health check
🚀 Server running on http://localhost:8000
```

### Start the Mobile App

In a new terminal:
```bash
npx expo start
```

This will open the Expo DevTools. You can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan the QR code with Expo Go app on your phone

---

## 📱 Using the App

### 1. **Create an Account**
- Open the app and tap "Create New Account"
- Enter your name, email, and password
- Tap "Create Account"

### 2. **Chat with AI**
- Type your question in the input field
- Send your message
- The app will automatically route to the most efficient AI tier

### 3. **Scan Barcodes**
- Tap the barcode icon (📷) in the header
- Point your camera at a product barcode
- View product information and eco-scores
- Optional: Add product details to your chat

### 4. **View Statistics**
- Tap the stats icon (📊) to see:
  - CO₂ saved
  - Water saved
  - Tokens saved
  - Query distribution

### 5. **Profile Management**
- Tap the profile icon (👤)
- View your stats
- Logout

---

## 🧪 Testing the AI Tiers

Try these examples to test different AI routing:

| Query | Expected Tier | Purpose |
|-------|---------------|---------|
| "hi" | Rule-based | Simple greeting |
| "what time is it" | Rule-based | Time query |
| "5 + 3" | Rule-based | Simple calculation |
| "what is Python" | Local AI | Moderate complexity |
| "explain machine learning" | Local AI | Concept explanation |
| "write a detailed analysis of quantum computing" | Cloud AI | High complexity |

---

## 🔧 Configuration Options

### Backend Configuration (local.py)

```python
# Toggle local AI in server mode
ENABLE_LOCAL_IN_SERVER = True  # Set to False to use cloud-only

# Change local model
LOCAL_MODEL = "microsoft/phi-2"  # Can use other HuggingFace models

# OpenRouter configuration
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
```

### Model Device Selection
The app automatically detects:
- **CUDA** (GPU) if available
- **CPU** as fallback

---

## 📊 API Endpoints

### POST `/chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "prompt": "What is Python?"
}
```

**Response:**
```json
{
  "answer": "[Local AI 💻] Python is a high-level programming language...",
  "source": "local",
  "tokens": 0,
  "co2": 0
}
```

### GET `/stats`
Get environmental impact statistics.

**Response:**
```json
{
  "report": "╔════════════...╝",
  "stats": {
    "rule_based_responses": 5,
    "local_responses": 10,
    "cloud_responses": 2,
    "tokens_saved": 1200,
    "co2_saved_grams": 2.4,
    "water_saved_ml": 375.0
  }
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "mode": "local+cloud",
  "model_loaded": true,
  "local_enabled": true
}
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: "ModuleNotFoundError: No module named 'flask'"
```bash
pip install flask flask-cors
```

**Problem**: Local AI model loading fails
- Ensure you have enough RAM (4GB+)
- Check internet connection (first download takes time)
- Set `ENABLE_LOCAL_IN_SERVER = False` to use cloud-only

**Problem**: "Port 8000 already in use"
```bash
# Find process using port 8000
# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**Problem**: "Network request failed"
- Ensure backend server is running
- Check `config.js` has correct IP address
- Verify phone and computer are on same WiFi network

**Problem**: Camera permissions denied
- Go to phone Settings > Apps > Expo Go
- Enable Camera permissions

**Problem**: Firebase authentication errors
- Verify `firebase.js` configuration
- Check Firebase Console for authentication settings

---

## 🌍 Environmental Impact

EcoRoute aims to minimize environmental impact by:

1. **Rule-Based Routing**: Simple queries answered without AI (~100% savings)
2. **Local AI**: Moderate queries handled on-device (saves ~90% vs cloud)
3. **Cloud Fallback**: Only complex queries use cloud resources

**Example Savings**:
- 10 rule-based responses = ~0.1g CO₂ saved
- 10 local AI responses = ~2.0g CO₂ saved
- vs. 20 cloud AI responses = ~4.0g CO₂ used

---

## 📝 Project Structure

```
EcoRoute/
├── App.js                 # Main React Native app
├── local.py              # Python Flask backend
├── firebase.js           # Firebase configuration
├── config.js             # API configuration
├── app.json              # Expo configuration
├── package.json          # Node dependencies
├── assets/               # App icons and images
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── README.md             # This file
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Microsoft Phi-2** - Efficient local language model
- **OpenRouter** - Cloud AI inference platform
- **HuggingFace** - Transformers library
- **Firebase** - Authentication services
- **Open Food Facts** - Product database API
- **Expo** - React Native development platform

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Open a new issue with details

---

## 🚀 Future Enhancements

- [ ] Offline mode with cached responses
- [ ] Multi-language support
- [ ] Enhanced eco-score calculations
- [ ] Product recommendation engine
- [ ] Social sharing features
- [ ] Dark/light theme toggle
- [ ] Voice input support

---

## 📈 Version History

**v1.0.0** (Current)
- Initial release
- Three-tier AI routing system
- Barcode scanning
- Firebase authentication
- Environmental impact tracking

---

**Made with 💚 for a sustainable future**
