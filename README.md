# EcoAI Guardian - AI-Powered Carbon Reduction Assistant

🚀 **Live Deployment**: [https://ecoai
...................................................................................-guardian-499914.uc.r.appspot.com](https://ecoai-guardian-499914.uc.r.appspot.com)

**EcoAI Guardian** is a production-ready, full-stack climate action application designed to help individuals understand, track, and reduce their personal carbon footprint. It behaves like a personal environmental coach by leveraging user habits, location intelligence, machine learning forecasting, and Google Cloud Services.

---

## 1. Problem Statement
Global greenhouse gas emissions continue to rise, and while individuals express a desire to reduce their carbon footprints, they lack **personalized, actionable, and context-aware data**. Typical calculators provide flat yearly estimations but do not account for daily commuting decisions, changing weather patterns, or local green amenities. 

## 2. Chosen Vertical
* **Climate and Sustainability**

## 3. Solution Explanation
EcoAI Guardian closes the gap between intention and action by creating an active **sustainability coaching loop**:
1. **Interactive Tracking**: Users log daily commute, food, energy, and waste habits.
2. **Context-Aware Analytics**: It calculates precise emissions using distance metrics and energy sources.
3. **Machine Learning Predictions**: A `scikit-learn` forecasting model analyzes user history, location, and seasonal climate shifts to predict next month's carbon footprint.
4. **AI Coaching (EcoBuddy)**: Powered by **Google Gemini**, EcoBuddy reads user context, identifies carbon spikes, and recommends customized reduction roadmaps.
5. **Real-Time Carbon Maps**: Incorporates Google Maps & Places to analyze travel coordinates and find local EV charging points, bus stations, or recycling hubs.
6. **Gamified Sprints**: Streaks, points, level-ups, and badges keep users engaged.

---

## 4. How It Works (Core Logic & Data Flow)

### 📊 Carbon Calculation & Scoring
The platform calculates daily greenhouse gas emissions in kilograms of CO2 ($kg\ CO_2$) using specific activity coefficients:
* **Transportation**: Petrol Bike ($0.12/km$), Diesel Car ($0.18/km$), EV ($0.05/km$), Public Transit ($0.04/km$), Walk/Cycle ($0.00/km$).
* **Home Energy**: Coal Grid ($0.85/kWh$), Mixed Grid ($0.45/kWh$), Solar ($0.05/kWh$).
* **Diet**: Meat Heavy ($8.0/day$), Balanced ($5.0/day$), Vegetarian ($2.5/day$), Vegan ($1.5/day$).
* **Lifestyle & Waste**: Purchases ($2.5/item$), Waste Landfilled ($1.5/day$), Waste Recycled ($0.2/day$).

The **Carbon Score** is computed out of 100:
* A score of **100** represents clean living ($\le 2.0\ kg\ CO_2/day$).
* A score of **0** represents critical emissions ($\ge 30.0\ kg\ CO_2/day$).
* Values in between are interpolated linearly:
  $$\text{Score} = 100 - \left( \frac{\text{Emissions} - 2.0}{30.0 - 2.0} \right) \times 100$$

### 🔮 Machine Learning Predictions
To forecast the user's carbon footprint for the next 30 days:
1. **Feature Engineering**: A `scikit-learn` `LinearRegression` model is trained on historical logs. Features include:
   * `day_index`: Tracks the overall long-term trend.
   * `day_of_week`: Captures weekly fluctuations (e.g., commute spikes on weekdays).
   * `seasonal_factor`: A localized sine-wave temperature modifier (heating/cooling loads).
2. **Cold-Start Bootstrapping**: If a new user has fewer than 15 logs, the engine generates synthetic historical logs using their default preferences and normal noise to seed the ML model.

### 💬 Contextual AI Coaching (EcoBuddy)
When you chat with EcoBuddy:
1. The backend fetches the user's latest Firestore profile and historical averages.
2. It constructs a rich context payload containing the user's name, city, current carbon score, daily average emissions, commute mode, and diet preference.
3. This payload, along with the user's question, is wrapped in a system prompt defining EcoBuddy's persona as an encouraging, metrics-driven advisor.
4. The prompt is sent to `gemini-1.5-flash` using the `google-genai` SDK to produce clean, formatted Markdown advice complete with emojis, difficulty ratings, and estimated $kg$ savings.

### 🗺️ Geolocation & Routes
* **Directions API**: Calculates route distances and compares transit options (e.g., driving vs. public transit) to show potential savings.
* **Places API**: Conducts localized radial searches (within 5 km) using keywords like `"electric vehicle charging station"`, `"recycling center"`, or `"organic food store"`.

---

## 5. System Architecture

```mermaid
graph TD
    subgraph Frontend [Vanilla JS SPA - Static HTML]
        UI[Dashboard / Circular Score]
        MapUI[Carbon Map & POIs]
        Buddy[EcoBuddy Chat Interface]
        Twin[Eco Digital Twin SVG]
        LS[Local Storage State]
    end

    subgraph Backend [FastAPI - Python]
        API[API Routers]
        Calc[Carbon Engine Calculator]
        ML[Scikit-Learn Predictor]
        BuddyAgent[EcoBuddy Agent Manager]
        DB[Database Router]
    end

    subgraph ExternalServices [Google & Firebase]
        Gemini[Google Gemini API]
        MapsAPI[Google Maps / Places]
        Firestore[Firebase Firestore DB]
    end

    UI -->|HTTP Requests| API
    MapUI -->|Coordinates & Routes| API
    Buddy -->|User Queries| API
    Twin -->|Milestone Completion| API

    API --> DB
    API --> Calc
    API --> ML
    API --> BuddyAgent

    DB -->|Hybrid Switch| Firestore
    DB -.->|Fallback Persistent| LocalJSON[local_db.json]
    BuddyAgent --> Gemini
    API --> MapsAPI
```

---

## 6. Technology Stack
* **Frontend**: Vanilla HTML5, CSS3, & Modern JS (Chart.js, Tailwind CSS, Lucide Icons, Canvas-Confetti).
* **Backend**: Python FastAPI, Uvicorn (ASGI server), Scikit-Learn (Predictive models), Pandas/Numpy (Data handling).
* **Database & Auth**: Firebase Firestore (Hybrid mode supports local JSON state if unconfigured).
* **AI & Location Services**: Google Gemini API (`gemini-1.5-flash`), Google Maps JavaScript API, Directions API, and Places API.

---

## 7. Features
1. **Personal Carbon Calculator**: Logs daily travel (km/mode), energy (kWh/source), meals (diet preferences), and shopping to yield a **Carbon Score out of 100**.
2. **EcoBuddy Chatbot**: Context-aware Gemini sustainability advisor with simulated conversational fallback.
3. **Real-Time Carbon Map**: Visualizes pollution zones, green parks, and sustainable POIs.
4. **AI Footprint Predictor**: Scikit-learn Linear Regression model forecasting next month's emissions based on seasonality.
5. **Eco Digital Twin**: Interactive SVG tree avatar that grows and blossoms as carbon scores improve, alongside a personalized weekly milestone roadmap.
6. **Community Leaderboard**: Gamified rankings based on **Carbon Saved** instead of carbon produced.

---

## 8. Installation & Setup

### Prerequisites
* Python 3.9+ (Python 3.13 supported)

### Launch Steps
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your API keys (optional; the app falls back to simulation mode if keys are empty):
   ```bash
   copy .env.example .env
   ```
4. Run the FastAPI dev server:
   ```bash
   python main.py
   ```
5. Open your browser and navigate to: `http://localhost:8000` (the backend automatically hosts the frontend assets at the root).

---

## 9. Quality Checks

Run these before submission:

```bash
python -m pytest
python -m ruff check . --no-cache
```

Current verified status:
* 19 automated tests passing across API, validation, security headers, carbon calculations, predictions, and local persistence.
* Ruff static analysis passing with no lint violations.
* Runtime state, local secrets, caches, and compiled Python artifacts excluded from Git, Docker, and Google Cloud uploads.

---

## 10. API Setup Instructions

* **Google Gemini API Key**: Get a key from the [Google AI Studio](https://aistudio.google.com/). Set `GEMINI_API_KEY` in `backend/.env`.
* **Google Maps API Key**: Set up a project in [Google Cloud Console](https://console.cloud.google.com/), enable the *Maps JavaScript API*, *Directions API*, and *Places API*, and generate an API key. Set `GOOGLE_MAPS_API_KEY` in `backend/.env`.
* **Firebase Firestore & Auth Service Account**: Create a project in [Firebase Console](https://console.firebase.google.com/). In Project Settings -> Service Accounts, select Python and click *Generate new private key*. Save the JSON file and set `FIREBASE_CREDENTIALS` to its absolute file path.

---

## 11. Security & Privacy
1. **User Location Control**: User coordinates are only analyzed locally in the browser or sent to Maps APIs with explicit user permission. A location consent settings card is provided.
2. **Hardened API Defaults**: CORS is restricted through `CORS_ALLOWED_ORIGINS`, HTTP security headers are applied, and string inputs are validated against basic script injection patterns.
3. **Encrypted Operations**: Firestore database access rules block unauthorized readers. In Demo Mode, information is kept locally in `backend/local_db.json`.
4. **Data Deletion**: In compliance with privacy standards, a "Delete My Environmental Profile" button clears all user profiles, logs, and Eco Twin states from memory and disk.

---

## 12. Future Improvements
* **Automated Smart Meter Integration**: Connect smart meters (e.g. Sense) to automate electricity logging.
* **Wearable Health Sync**: Read steps directly from Google Fit or Apple Health to automatically log walking offsets.
* **Collaborative Challenges**: Enable users to form clubs and participate in team vs team sustainability brackets.
