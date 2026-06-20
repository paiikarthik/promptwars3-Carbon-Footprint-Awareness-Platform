import os
from google import genai

# Initialize Gemini if API key exists
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None

if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")
        client = None

# High-fidelity mock responses for fallback mode
MOCK_RESPONSES = [
    {
        "keywords": ["electric", "electricity", "bill", "energy", "power", "ac", "appliances"],
        "reply": """### 💡 Home Energy Efficiency Analysis

Your electricity carbon footprint is currently **medium-high**. Let's optimize this together!

1. **AC Optimization**: Reducing air conditioner usage by **1 hour/day** saves approximately **20 kg CO2 monthly** and lowers your energy bill by 8-10%.
2. **Phantom Loads**: Electronics draw power even when turned off. Unplugging chargers and television setups can save **5 kg CO2 monthly**.
3. **LED Lighting**: Upgrading 5 halogen bulbs to LED reduces energy usage by 80%, saving **12 kg CO2 monthly**.

* **Recommended Action**: Adjust your AC temperature to 24°C (75°F) instead of 18-20°C.
* **Difficulty Level**: Easy 🟢
* **Estimated Monthly Savings**: 20-30 kg CO2"""
    },
    {
        "keywords": ["travel", "bike", "car", "transport", "commute", "gas", "petrol", "transit", "distance"],
        "reply": """### 🚗 Transport Carbon Optimization

Transportation is one of the highest emission sources. Here are tailored options for your commute:

1. **Public Transit**: Taking the bus or train instead of a petrol bike just **3 days a week** can reduce your emissions by **30 kg CO2 monthly**.
2. **Carpooling**: Sharing rides with peers/colleagues cuts emissions by 50% per trip, saving about **18 kg CO2 monthly**.
3. **Active Transport**: For trips under 3 km, walking or cycling produces **zero emissions** and saves around **10 kg CO2 monthly** while boosting cardiovascular health.

* **Recommended Action**: Use a public transport pass on Mondays, Wednesdays, and Fridays.
* **Difficulty Level**: Medium 🟡
* **Estimated Monthly Savings**: 30 kg CO2"""
    },
    {
        "keywords": ["food", "diet", "meal", "meat", "vegan", "vegetarian", "waste", "plastic"],
        "reply": """### 🥗 Sustainable Dining & Waste Reduction

Your food choices have a major environmental impact. Transitioning your diet slightly can make a huge difference:

1. **Meatless Mondays**: Skipping red meat just one day a week saves **8 kg CO2 monthly**.
2. **Reduce Food Waste**: Meal planning and freezing leftovers prevents food rot in landfills (which produces methane), saving **15 kg CO2 monthly**.
3. **Zero Single-Use Plastics**: Bringing your own bags and cups saves energy associated with plastic manufacturing, reducing **4 kg CO2 monthly**.

* **Recommended Action**: Try a plant-based lunch three times a week.
* **Difficulty Level**: Easy 🟢
* **Estimated Monthly Savings**: 15-20 kg CO2"""
    },
    {
        "keywords": ["predict", "future", "forecast", "next month", "trend"],
        "reply": """### 📈 Carbon Prediction Insight

Based on your current habits and seasonal trends:
* **Next Month Forecast**: Expected **340 kg CO2** (an increase of 8% due to rising summer temperatures and increased AC load).
* **Main Driver**: Cooling appliances and active travel in warmer weather.

**How to counter this:**
* Use scheduling timers on cooling systems.
* Walk/cycle during cooler morning hours.
* Track electricity usage daily to catch spikes early.

* **Recommended Action**: Set a 2-hour sleep timer on your AC.
* **Difficulty Level**: Easy 🟢
* **Estimated Monthly Savings**: 15 kg CO2"""
    }
]

DEFAULT_FALLBACK = """### 🌿 EcoBuddy Sustainability Coach

Hello! I'm your environmental coach. I can help you track, analyze, and reduce your carbon footprint. 

Here are some things we can discuss:
1. **Analyze your commute**: Tell me how far you travel and your mode of transport.
2. **Optimize home electricity**: Ask how to reduce electricity usage and cooling costs.
3. **Dietary impact**: Learn about how shifting to plant-based meals cuts emissions.
4. **Your carbon predictions**: Ask what your carbon footprint might look like next month.

*How can I help you protect our planet today?*"""

def ask_ecobuddy(query: str, user_context: dict) -> str:
    """
    Sends the user's query and context to Gemini or generates a premium simulated response.
    """
    if client:
        try:
            # Build rich prompt with user context
            system_instruction = (
                "You are EcoBuddy, an engaging, expert, and encouraging environmental sustainability coach. "
                "Your objective is to help the user understand, track, and reduce their carbon footprint. "
                "Provide detailed suggestions, the science behind them, difficulty ratings (Easy, Medium, Hard), "
                "and estimated CO2 savings in kg. Use clean Markdown styling with emojis, sections, and clear bullet points."
            )
            
            context_prompt = (
                f"User Profile Details:\n"
                f"- Name: {user_context.get('displayName', 'Eco Warrior')}\n"
                f"- Location: {user_context.get('city', 'Unknown City')}\n"
                f"- Carbon Score: {user_context.get('carbon_score', 70)}/100\n"
                f"- Commute: {user_context.get('commute_distance_km', 15)} km via {user_context.get('commute_mode', 'petrol_bike')}\n"
                f"- Diet: {user_context.get('diet_preference', 'balanced')}\n"
                f"- Current Daily Carbon: {user_context.get('current_daily_co2', 12.0)} kg CO2\n\n"
                f"User: \"{query}\"\n\n"
                f"Assistant:"
            )
            
            full_prompt = f"{system_instruction}\n\n{context_prompt}"
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=full_prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini API invocation error, using fallback: {e}")
            # Fall back to mock response matching
            
    # Mock matching logic
    normalized_query = query.lower()
    for item in MOCK_RESPONSES:
        if any(keyword in normalized_query for keyword in item["keywords"]):
            return item["reply"]
            
    return DEFAULT_FALLBACK
