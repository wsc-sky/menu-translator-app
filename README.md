# Menu Translator 🌍🍽️

An AI-powered web application that translates foreign menu photos into your preferred language with detailed dish information including ingredients, allergens, spice levels, and dietary information.

## Features ✨

- **Photo Upload**: Drag & drop or select multiple menu photos
- **AI Analysis**: Uses OpenAI's GPT-4 Vision to extract and translate menu items
- **Structured Data**: Returns detailed information including:
  - Dish names (original + translated)
  - Ingredients and allergens
  - Spice levels and flavor profiles
  - Kids-friendly indicators
  - Price information
  - Allergy alerts based on your specified allergies
- **Modern UI**: Beautiful, responsive web interface
- **Export Results**: Download analysis results as JSON

## Quick Start 🚀

### Prerequisites
- Python 3.8+
- OpenAI API key

### Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your OpenAI API key:**
   
   Create a `.env` file in the project directory:
   ```bash
   echo "OPENAI_API_KEY=your-api-key-here" > .env
   ```
   
   Or set it as an environment variable:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

4. **Run the application:**
   ```bash
   python run.py
   ```
   
   Or directly with uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Open your browser:**
   Navigate to `http://localhost:8000`

## Usage 📱

1. **Upload Photos**: Select or drag & drop menu photos (up to 10 images)
2. **Configure Settings**:
   - Choose target language for translation
   - Specify any allergies you have
   - Select currency (optional)
3. **Analyze**: Click "Analyze Menu" and wait for AI processing
4. **View Results**: Browse the structured menu information
5. **Export**: Download results as JSON if needed

## API Endpoints 🔌

- `GET /` - Main web interface
- `POST /analyze_menu` - Analyze menu photos
  - Form data: `target_language`, `allergy_info`, `currency`, `images[]`

## Supported Languages 🌐

- English, Spanish, French, German, Italian, Portuguese
- Japanese, Korean, Chinese, Arabic, Hindi, Russian

## Technical Details 🔧

- **Backend**: FastAPI with OpenAI GPT-4 Vision
- **Frontend**: Vanilla HTML/CSS/JavaScript with modern UI
- **File Handling**: Supports multiple image formats
- **CORS**: Configured for cross-origin requests

## Example Output 📄

The API returns structured JSON with detailed dish information:

```json
{
  "target_language": "en",
  "currency": "CNY",
  "user_allergies": ["peanut"],
  "dishes": [
    {
      "dish_id": "1",
      "name": {
        "src": "宫保鸡丁",
        "translated": "Kung Pao Chicken"
      },
      "description": {
        "translated": "Spicy stir-fried chicken with peanuts and vegetables"
      },
      "ingredients": ["chicken", "peanuts", "vegetables", "chili"],
      "flavor_profile": ["spicy", "savory"],
      "spice_level": 3,
      "kids_friendly": "caution_spicy",
      "allergy_alert": "contains",
      "price": {"amount": 28, "currency": "CNY"}
    }
  ]
}
```

## Troubleshooting 🔍

- **API Key Issues**: Ensure your OpenAI API key is correctly set
- **Image Upload**: Make sure images are in supported formats (JPEG, PNG, etc.)
- **Large Files**: The app handles multiple images but very large files may take longer to process
- **Network Issues**: Check your internet connection for API calls

## License 📝

This project is open source. Feel free to modify and distribute according to your needs.

## Contributing 🤝

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.
