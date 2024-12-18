import json
import http.server
import asyncio
from http import HTTPStatus
from groq import Groq
import google.generativeai as genai
from concurrent.futures import ThreadPoolExecutor, as_completed
from g4f.client import Client
from g4f.Provider import OpenaiChat

PORT = 5005
API_KEY = "AIzaSyCNd9IJQ7_n_CuwFDoJ_pspYEJ024hZ28U"
genai.configure(api_key=API_KEY)

# Generation configuration for Gemini models
generation_config = {
    "temperature": 0.5,
    "top_p": 0.8,
    "top_k": 5,
    "max_output_tokens": 1024,
    "response_mime_type": "text/plain",
}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

# Initialize the generative model
gemini_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    safety_settings=safety_settings,
    generation_config=generation_config,
)

with open('models.json', 'r') as f:
    data = json.load(f)

models = data['models']

def get_topic(model, query):
    groq_client = Groq()
    completion = groq_client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": "give me 3 word max of the topic of the next query -> " + query}],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )
    result = []
    for chunk in completion:
        content = chunk.choices[0].delta.content or ""
        result.append(content)
    return model, query, "".join(result)

def process_gpt(query):
    client = Client(provider=OpenaiChat)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Explain this in details\n{query}"}],
    )
    return str(response.choices[0].message.content)

def process_query(model, query):
    groq_client = Groq()
    if model == "gemini-1.5-flash":
        chat_session = gemini_model.start_chat(
            history=[{"role": "user", "parts": ["Give me a detailed result about the next query"]}]
        )
        response = chat_session.send_message(query)
        return model, query, response.text
    elif model == "topic":
        return get_topic(model, query)
    elif model == "gpt-4o-mini":
        response = process_gpt(query)
        return model, query, response
    else:
        completion = groq_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": query}],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )
        result = []
        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            result.append(content)
        return model, query, "".join(result)

def query_chatbots(query, models):
    results = [] 
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_query = {
            executor.submit(process_query, model, query): (model, query)
            for model in models
        }
        for future in as_completed(future_to_query):
            try:
                model_name, query, response_text = future.result()
                results.append({"model": model_name, "response": response_text})
            except Exception as e:
                model, query = future_to_query[future]
                results.append({"model": model,"response": "NA"})
    return results

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        super().do_GET()

    def do_POST(self):
        """Handle POST requests."""
        if self.path == '/send_data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode())
                query = data.get("query")
                models = data.get("models")
                models.append("topic")
                if not query:
                    self.send_response(HTTPStatus.BAD_REQUEST)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No query provided"}).encode())
                    return

                # Process the query across all models
                results = query_chatbots(query, models)

                # Respond with the result
                self.send_response(HTTPStatus.OK)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response_data = {"query": query, "response": results}
                self.wfile.write(json.dumps(response_data).encode())
            
            except Exception as e:
                self.send_response(HTTPStatus.INTERNAL_SERVER_ERROR)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        else:
            self.send_error(HTTPStatus.NOT_FOUND)

if __name__ == '__main__':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    server_address = ('', PORT)  # Use port 5005
    httpd = http.server.HTTPServer(server_address, CustomHandler)
    print(f"Server running on port {PORT}...")
    httpd.serve_forever()
