import json
from datetime import datetime
import os
import requests
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS  # ADD THIS - enables mobile app connection
import sys

# ==================== CONFIG ====================
OPENROUTER_API_KEY = "YOURAPIKEY" # Change this api key
LOCAL_MODEL = "microsoft/phi-2"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Check if running as server
IS_SERVER_MODE = len(os.sys.argv) > 1 and os.sys.argv[1] == 'server'

# NEW: Allow local model in server mode (set to True to enable)
ENABLE_LOCAL_IN_SERVER = True  # Change to False to disable local model in server

# Force flush stdout/stderr immediately
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Import ML libraries based on settings
SHOULD_IMPORT_ML = not IS_SERVER_MODE or (IS_SERVER_MODE and ENABLE_LOCAL_IN_SERVER)

if SHOULD_IMPORT_ML:
    try:
        from optimum.onnxruntime import ORTModelForCausalLM
        USE_ONNX = True
    except ImportError:
        USE_ONNX = False

    from transformers import AutoModelForCausalLM
    from transformers import AutoTokenizer
    import torch
else:
    USE_ONNX = False

CACHE_DIR = Path.home() / ".ecoai_cache"
CACHE_DIR.mkdir(exist_ok=True)

def log(msg):
    """Helper function to ensure logs are visible"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {msg}", flush=True)
    sys.stdout.flush()

class EcoAI:
    def __init__(self, use_local=True, force_cloud=False):
        log("=== EcoAI.__init__() called ===")
        self.use_local = use_local and not force_cloud
        self.stats = {
            'rule_based_responses': 0,
            'local_responses': 0,
            'cloud_responses': 0,
            'tokens_saved': 0,
            'co2_saved_grams': 0.0,
            'water_saved_ml': 0.0,
            'total_tokens_used': 0,
            'reasoning_tokens_used': 0
        }
        
        # Initialize model and tokenizer BEFORE loading
        self.local_model = None
        self.tokenizer = None
        self.device = None
        
        # Load local model if enabled
        if self.use_local and SHOULD_IMPORT_ML:
            log("🔄 Loading local AI model...")
            success = self.load_local_model()
            if not success:
                log("⚠️  Switching to cloud-only mode")
                self.use_local = False
        elif IS_SERVER_MODE and not ENABLE_LOCAL_IN_SERVER:
            log("⚠️  Server mode: Local AI disabled by config (use cloud API)")
            self.use_local = False
        
        log(f"=== EcoAI initialized: use_local={self.use_local} ===")
    
    def load_local_model(self):
        """Load local model - FIXED DEVICE MAPPING"""
        if IS_SERVER_MODE and not ENABLE_LOCAL_IN_SERVER:
            log("   ❌ Server mode with local disabled - skipping local model load")
            return False
        
        try:
            log("   📦 Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                LOCAL_MODEL,
                cache_dir=CACHE_DIR,
                trust_remote_code=True
            )
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            log("   ✅ Tokenizer loaded")
            
            log("   🧠 Loading model weights (this takes 15-30 seconds)...")
            
            # Determine device first
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            log(f"   Using device: {self.device}")
            
            # Load model WITHOUT device_map to avoid meta device issue
            self.local_model = AutoModelForCausalLM.from_pretrained(
                LOCAL_MODEL,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                cache_dir=CACHE_DIR,
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            
            # Explicitly move model to device
            log(f"   Moving model to {self.device}...")
            self.local_model = self.local_model.to(self.device)
            
            log("   ✅ Model weights loaded")
            
            # TEST the model works
            log("   🧪 Testing model...")
            test_input = self.tokenizer("test", return_tensors="pt")
            test_input = {k: v.to(self.device) for k, v in test_input.items()}
            
            with torch.no_grad():
                test_output = self.local_model.generate(**test_input, max_new_tokens=5)
            
            log("   ✅ Model test successful!")
            log("   ✅ Local AI model ready!")
            
            return True
            
        except Exception as e:
            log(f"   ❌ ERROR loading model:")
            log(f"   {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def calculate_environmental_impact(self, tokens_used):
        co2_grams = tokens_used * 0.002
        water_ml = 25.0
        return co2_grams, water_ml
    
    def update_stats(self, response_type, tokens=0):
        """Centralized stats update with logging"""
        log(f"   📊 Updating stats: type={response_type}, tokens={tokens}")
        
        if response_type == 'rule-based':
            self.stats['rule_based_responses'] += 1
            self.stats['tokens_saved'] += 50
            co2, water = self.calculate_environmental_impact(50)
            self.stats['co2_saved_grams'] += co2
            self.stats['water_saved_ml'] += water
            
        elif response_type == 'local':
            self.stats['local_responses'] += 1
            estimated_tokens = 100
            self.stats['tokens_saved'] += estimated_tokens
            co2, water = self.calculate_environmental_impact(estimated_tokens)
            self.stats['co2_saved_grams'] += co2
            self.stats['water_saved_ml'] += water
            
        elif response_type == 'cloud':
            self.stats['cloud_responses'] += 1
            self.stats['total_tokens_used'] += tokens
        
        log(f"   📊 Stats now: {self.stats}")
    
    def handle_rule_based(self, prompt):
        """Handle trivial tasks"""
        prompt_lower = prompt.lower().strip()
        
        # Greetings
        greetings = ["hi", "hello", "hey", "sup", "howdy"]
        if any(prompt_lower == word or prompt_lower.startswith(word + " ") for word in greetings):
            return "Hello! How can I help you today! 🌱"
        
        # Time
        if "what time" in prompt_lower or "current time" in prompt_lower:
            return f"⏰ {datetime.now().strftime('%I:%M %p')}"
        
        # Date
        if "what date" in prompt_lower or "today" in prompt_lower:
            return f"📅 {datetime.now().strftime('%A, %B %d, %Y')}"
        
        # Simple math
        try:
            if any(op in prompt for op in ['+', '-', '*', '/']):
                calc = prompt.lower()
                for word in ['what is', 'calculate', '=', '?']:
                    calc = calc.replace(word, '')
                calc = calc.strip()
                
                if calc and all(c in '0123456789+-*/(). ' for c in calc):
                    result = eval(calc)
                    return f"🧮 {result}"
        except:
            pass
        
        return None
    
    def categorize_complexity(self, prompt):
        """
        FIXED: More aggressive about using local AI
        Only mark as complex if REALLY complex
        """
        prompt_lower = prompt.lower()
        word_count = len(prompt.split())
        
        # VERY complex indicators (these MUST use cloud)
        very_complex_keywords = [
            "write code",
            "create a program",
            "explain in detail",
            "comprehensive analysis",
            "step by step guide",
            "detailed explanation",
            "compare and contrast",
            "prove mathematically",
            "write an essay",
            "design a system"
        ]
        
        # Long questions
        if word_count > 40:  # Increased threshold
            return "complex"
        
        # Check for VERY complex phrases
        for keyword in very_complex_keywords:
            if keyword in prompt_lower:
                return "complex"
        
        # Everything else is SIMPLE (use local)
        return "simple"
    
    def local_inference(self, prompt, max_tokens=100):
        """Run inference on local model - FIXED DEVICE HANDLING"""
        log(f"      → local_inference() called")
        
        if not self.use_local:
            log(f"      ✗ use_local = False")
            return None
        
        if self.local_model is None:
            log(f"      ✗ local_model is None")
            return None
        
        if self.device is None:
            log(f"      ✗ device is None")
            return None
        
        log(f"      ✓ Model is loaded on {self.device}, generating...")
        
        try:
            # Better prompt formatting for Phi-2
            formatted_prompt = f"Instruct: {prompt}\nOutput:" 
            
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=256
            )
            
            # Move inputs to the same device as model
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate
            with torch.no_grad():
                outputs = self.local_model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Clean up response
            if "Output:" in response:
                response = response.split("Output:")[-1].strip()
            
            log(f"      ✓ Generated: '{response[:100]}...'")
            return response
            
        except Exception as e:
            log(f"      ✗ Error in local_inference: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def cloud_inference(self, prompt, max_tokens=150):
        """Query OpenRouter API - ENHANCED ERROR LOGGING"""
        log(f"      → cloud_inference() called")
        
        try:
            payload = {
                "model": "arcee-ai/trinity-large-preview:free",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens
            }
            
            log(f"      Sending request...")
            
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30
            )
            
            log(f"      Response status: {response.status_code}")
            
            # Log response for debugging
            if response.status_code != 200:
                log(f"      ✗ API Error Response: {response.text}")
                response.raise_for_status()
            
            data = response.json()
            log(f"      ✓ Response received")
            
            # Extract response
            answer = data['choices'][0]['message']['content'].strip()
            
            # Track tokens
            usage = data.get('usage', {})
            tokens = usage.get('total_tokens', max_tokens)
            reasoning_tokens = usage.get('completion_tokens_details', {}).get('reasoning_tokens', 0)
            
            self.stats['reasoning_tokens_used'] += reasoning_tokens
            
            log(f"      ✓ Cloud response: '{answer[:100]}...'")
            log(f"      ✓ Tokens used: {tokens}")
            return answer, tokens
            
        except requests.exceptions.Timeout:
            log(f"      ✗ Cloud API Timeout after 30 seconds")
            return None, 0
        except requests.exceptions.RequestException as e:
            log(f"      ✗ Cloud API Request Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                log(f"      ✗ Response text: {e.response.text}")
            return None, 0
        except KeyError as e:
            log(f"      ✗ Cloud API Response parsing error: {e}")
            return None, 0
        except Exception as e:
            log(f"      ✗ Cloud API Unexpected Error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return None, 0
    
    def answer_question(self, prompt):
        """Main routing logic"""
        log(f"\n🔍 Processing: '{prompt}'")
        
        # 1. Try rule-based first
        log("   Step 1: Checking rule-based...")
        rule_response = self.handle_rule_based(prompt)
        if rule_response:
            log("   ✓ Answered by rules")
            self.update_stats('rule-based')
            return {
                'answer': rule_response,
                'source': 'rule-based',
                'tokens': 0,
                'co2': 0
            }
        
        # 2. Categorize complexity
        log("   Step 2: Categorizing complexity...")
        complexity = self.categorize_complexity(prompt)
        log(f"   → Complexity: {complexity}")
        
        # 3. Try local AI for simple queries
        if complexity == "simple" and self.use_local:
            log("   Step 3: Trying local AI...")
            local_response = self.local_inference(prompt)
            
            if local_response:
                log("   ✓ Answered by local AI")
                self.update_stats('local')
                
                return {
                    'answer': f"[Local AI 🌱] {local_response}",
                    'source': 'local',
                    'tokens': 0,
                    'co2': 0
                }
        
        # 4. Fall back to cloud
        log("   Step 4: Using cloud AI...")
        cloud_response, tokens = self.cloud_inference(prompt)
        
        if cloud_response:
            log("   ✓ Answered by cloud")
            self.update_stats('cloud', tokens)
            co2, water = self.calculate_environmental_impact(tokens)
            
            return {
                'answer': f"[Cloud AI 🌐] {cloud_response}",
                'source': 'cloud',
                'tokens': tokens,
                'co2': co2
            }
        
        # If we get here, both local and cloud failed
        log("   ✗ Both local and cloud inference failed")
        return {
            'answer': "Sorry, I couldn't generate a response. Please check server logs for details.",
            'source': 'error',
            'tokens': 0,
            'co2': 0
        }
    
    def get_impact_report(self):
        """Generate environmental impact report"""
        total_queries = (
            self.stats['rule_based_responses'] +
            self.stats['local_responses'] +
            self.stats['cloud_responses']
        )
        
        log(f"📊 Generating report. Stats: {self.stats}")
        
        if total_queries == 0:
            return "No queries processed yet."
        
        local_pct = (self.stats['local_responses'] / total_queries) * 100 if total_queries > 0 else 0
        rule_pct = (self.stats['rule_based_responses'] / total_queries) * 100 if total_queries > 0 else 0
        cloud_pct = (self.stats['cloud_responses'] / total_queries) * 100 if total_queries > 0 else 0
        
        report = f"""
╔════════════════════════════════════════════════════════════╗
║              🌱 ENVIRONMENTAL IMPACT REPORT 🌱             ║
╠════════════════════════════════════════════════════════════╣
║ Total Queries: {total_queries:>3}                                         ║
║   • Rule-based: {self.stats['rule_based_responses']:>3} ({rule_pct:>5.1f}%)                         ║
║   • Local AI:   {self.stats['local_responses']:>3} ({local_pct:>5.1f}%)                         ║
║   • Cloud AI:   {self.stats['cloud_responses']:>3} ({cloud_pct:>5.1f}%)                         ║
╠════════════════════════════════════════════════════════════╣
║ SAVINGS (Local vs Cloud):                                 ║
║   💨 CO₂ Saved:    {self.stats['co2_saved_grams']:>8.2f} grams                     ║
║   💧 Water Saved:  {self.stats['water_saved_ml']:>8.0f} ml                        ║
║   🎫 Tokens Saved: {self.stats['tokens_saved']:>8,}                          ║
╠════════════════════════════════════════════════════════════╣
║ CLOUD USAGE:                                               ║
║   Total Tokens:     {self.stats['total_tokens_used']:>8,}                         ║
║   Reasoning Tokens: {self.stats['reasoning_tokens_used']:>8,}                         ║
╚════════════════════════════════════════════════════════════╝
"""
        return report


# ==================== FLASK SERVER ====================
app = Flask(__name__)
CORS(app)  # ADD THIS - allows requests from mobile app
eco_ai_instance = None

@app.route('/chat', methods=['POST'])
def chat():
    log("\n========== /chat endpoint called ==========")
    global eco_ai_instance
    
    try:
        if eco_ai_instance is None:
            log("⚠️  Initializing EcoAI...")
            eco_ai_instance = EcoAI(use_local=True)

        data = request.get_json()
        log(f"Request data: {data}")
        
        prompt = data.get('prompt', '')
        log(f"Prompt received: '{prompt}'")

        if not prompt:
            log("ERROR: No prompt provided")
            return jsonify({'error': 'No prompt provided'}), 400

        result = eco_ai_instance.answer_question(prompt)
        log(f"Result: {result}")
        
        response = jsonify({
            'answer': result['answer'],
            'source': result['source'],
            'tokens': result['tokens'],
            'co2': result['co2']
        })
        
        log("Response sent successfully")
        return response
        
    except Exception as e:
        log(f"EXCEPTION in /chat: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def stats():
    log("\n========== /stats endpoint called ==========")
    global eco_ai_instance
    
    if eco_ai_instance is None:
        log("⚠️  No eco_ai_instance - initializing...")
        eco_ai_instance = EcoAI(use_local=True)

    log(f"Current stats: {eco_ai_instance.stats}")
    report = eco_ai_instance.get_impact_report()
    
    response = {
        'report': report,
        'stats': eco_ai_instance.stats  # Changed from 'raw' to 'stats' for clarity
    }
    
    log(f"Returning stats response: {response}")
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    log("\n========== /health endpoint called ==========")
    return jsonify({
        'status': 'ok',
        'mode': 'local+cloud' if ENABLE_LOCAL_IN_SERVER else 'cloud-only',
        'model_loaded': eco_ai_instance is not None,
        'local_enabled': ENABLE_LOCAL_IN_SERVER
    })


# ==================== MAIN ====================
if __name__ == "__main__":
    log("========================================")
    log("Starting EcoAI Application")
    log(f"IS_SERVER_MODE: {IS_SERVER_MODE}")
    log(f"ENABLE_LOCAL_IN_SERVER: {ENABLE_LOCAL_IN_SERVER}")
    log(f"Arguments: {sys.argv}")
    log("========================================")
    
    # Check if running as server
    if len(os.sys.argv) > 1 and os.sys.argv[1] == 'server':
        log("🌐 Starting EcoAI Flask server...")
        log("📡 Endpoints:")
        log("   POST /chat - Send chat messages")
        log("   GET /stats - Get environmental impact stats")
        log("   GET /health - Health check")
        log("🚀 Server running on http://localhost:8000")
        
        # Preload the AI model
        log("🔄 Preloading EcoAI...")
        eco_ai_instance = EcoAI(use_local=True)
        log("✅ EcoAI ready!")
        
        app.run(host='0.0.0.0', port=8000, debug=True)
    else:
        # Original demo code
        log("🌱 EcoAI - Sustainable AI")
        log("="*60)
        
        eco_ai = EcoAI(use_local=True)
        
        log("\n" + "="*60)
        log("Commands: 'stats' | 'quit'")
        log("="*60)
        
        # Suggest test queries
        log("\n💡 TEST QUERIES:")
        log("   1. hi                    (rule-based)")
        log("   2. what is Python        (local AI)")
        log("   3. what is machine learning (local AI)")
        log("   4. who created Python    (local AI)")
        log("   5. explain quantum computing in detail (cloud)")
        log("")
        
        while True:
            try:
                user_input = input("You: ").strip()
                
                if user_input.lower() == 'quit':
                    print("\n" + eco_ai.get_impact_report())
                    break
                
                if user_input.lower() == 'stats':
                    print(eco_ai.get_impact_report())
                    continue
                
                if not user_input:
                    continue
                
                print()  # Spacing
                result = eco_ai.answer_question(user_input)
                print(f"\n{result['answer']}")
                
                if result['co2'] > 0:
                    print(f"💨 {result['co2']:.4f}g CO₂ | {result['tokens']} tokens")
                
                print()
                
            except KeyboardInterrupt:
                print("\n\n" + eco_ai.get_impact_report())
                break
            except Exception as e:
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()
