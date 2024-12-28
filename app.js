let topicResponse;
const models = [
  "llama-3.2-90b-vision-preview",
  "llama3-70b-8192",
  "llama-3.1-70b-versatile",
  "llama-3.3-70b-specdec",
  "llama-3.2-11b-vision-preview",
  "llama-3.3-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
  "gemini-1.5-flash",
  "gpt-4o",
  "gpt-4-turbo",
  "blackboxai-pro",
  "claude-3.5-sonnet",
];

models_images = [
  "flux",
  "flux-pro",
  "flux-realism",
  "flux-anime",
  "flux-3d",
  "flux-disney",
  "flux-pixel",
  "flux-4o",
  "dall-e-3",
  "any-dark",
];

models.sort();
models_images.sort();

let selectedModels = [...models];
let selectedModels_images = [...models_images];

function createModelButtons() {
  const container = document.getElementById("model-buttons-container");
  const container_images = document.getElementById(
    "images-model-buttons-container"
  );
  container.innerHTML = "";

  models.forEach((model) => {
    const button = document.createElement("button");
    button.textContent = model;
    button.classList.add("model-button");
    button.classList.add("selected");
    button.onclick = () => toggleModelSelection(model, button);
    container.appendChild(button);
  });
  models_images.forEach((model) => {
    const button = document.createElement("button");
    button.textContent = model;
    button.classList.add("model-button");
    button.classList.add("selected");
    button.onclick = () => toggleModelSelection(model, button);
    container_images.appendChild(button);
  });
}

function toggleModelSelection(model, button) {
  if (selectedModels.includes(model)) {
    selectedModels = selectedModels.filter((m) => m !== model);
    button.classList.remove("selected");
  } else {
    selectedModels.push(model);
    button.classList.add("selected");
  }
}

function sendData(query, models) {
  const data = {
    query: query,
    models: models,
  };

  fetch("/send_data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      topicResponse =
        data.response.find((result) => result.model === "topic")?.response ||
        "";
      const wordCount = topicResponse.trim().split(/\s+/).length;
      if (wordCount > 3) {
        topicResponse = "No Topic to Display";
      }
      const responseContainer = document.getElementById("response-container");
      responseContainer.innerHTML = "";
      const heading = document.createElement("h1");
      heading.innerHTML = `Responses: <span>${topicResponse}</span>`;
      responseContainer.appendChild(heading);

      let allResponses = `Query: ${query}\n`;

      data.response.forEach((result) => {
        if (result.model === "topic") return;
        const responseBox = document.createElement("div");
        responseBox.classList.add("response-box");

        const modelTitle = document.createElement("h3");
        modelTitle.textContent = `Model: ${result.model}`;
        responseBox.appendChild(modelTitle);

        let formattedResponse = result.response
          .replace(/\n/g, "<br>")
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        const modelResponse = document.createElement("p");
        modelResponse.innerHTML = formattedResponse;
        responseBox.appendChild(modelResponse);

        allResponses +=
          "\n===================================================\n\n";
        allResponses += `Model: ${result.model}\nResponse: ${result.response}\n`;
        responseContainer.appendChild(responseBox);
      });

      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("button-container");

      const saveButton = document.createElement("button");
      saveButton.textContent = "Save Responses";
      saveButton.classList.add("model-button");
      saveButton.classList.add("selected");
      saveButton.onclick = () => saveResponsesToFile(allResponses);

      buttonContainer.appendChild(saveButton);
      responseContainer.appendChild(buttonContainer);
    })
    .catch((error) => {
      console.error("Error sending/receiving data:", error);
      document.getElementById("response-container").textContent =
        "Error connecting to server.";
    });
}

function sendDataforimages(query, models) {
  const data = {
    query: query,
    models: models,
  };
  fetch("/send_dataforimages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      loadImages(data);
    })
    .catch((error) => {
      console.error("Error sending/receiving data:", error);
      document.getElementById("response-container").textContent =
        "Error connecting to server.";
    });
}

document.getElementById("submit").addEventListener("click", () => {
  const query = document.getElementById("query").value;

  if (!query.trim()) {
    alert("Please enter a query.");
    return;
  }
  if (selectedModels.length === 0) {
    alert("Please select at least one model.");
    return;
  }
  document.getElementById("response-container").innerHTML =
    "Processing your query...";
  sendData(query, selectedModels);
});

document.getElementById("submit_prompt").addEventListener("click", () => {
  const query = document.getElementById("image-prompt").value;

  if (!query.trim()) {
    alert("Please enter your prompt.");
    return;
  }
  document.getElementById("response-images-process").innerHTML =
    "Generating your images...";
  sendDataforimages(query, selectedModels_images);
});

function saveResponsesToFile(content) {
  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  let result = topicResponse
    ? topicResponse.replace(/\./g, "").trim()
    : "default";
  link.download = `${result}.txt`;
  link.click();
}

createModelButtons();

function loadImages(data) {
  data.response.sort((a, b) => {
    return a.model.localeCompare(b.model);
  });
  const responseText = document.getElementById("response-images-container");
  const responseContainer = document.getElementById(
    "response-images-container"
  );
  responseText.innerHTML = "";
  responseContainer.innerHTML = "";
  data.response.forEach((result) => {
    const image = document.createElement("img");
    image.src = result.response;
    image.alt = `Image generated by ${result.model}`;

    const caption = document.createElement("p");
    caption.textContent = `Model: ${result.model}`;

    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");

    const link = document.createElement("a");
    link.href = result.response;
    link.target = "_blank";
    link.textContent = "Open Image in a New Tab";

    imageContainer.appendChild(image);
    imageContainer.appendChild(caption);
    imageContainer.appendChild(link);

    responseContainer.appendChild(imageContainer);
  });
}
