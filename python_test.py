from g4f.client import Client
from g4f.Provider import OpenaiChat, Gemini
client = Client(provider=OpenaiChat,)
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain in details this\n Who are you?"}],
    # Add any other necessary parameters
)
print(response.choices[0].message.content)