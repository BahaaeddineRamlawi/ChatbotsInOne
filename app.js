let models;
let selectedModels;
let topicResponse;

function loadModels(callback) {
  fetch("models.json")
    .then((response) => response.json())
    .then((data) => {
      callback(data.models); // Pass the models to the callback function
    })
    .catch((error) => {
      console.error("Error loading the models file:", error);
    });
}

// Usage
loadModels((fetchedModels) => {
  models = fetchedModels;
  selectedModels = models;
});

function createModelButtons() {
  const container = document.getElementById("model-buttons-container");
  container.innerHTML = "";

  models.forEach((model) => {
    const button = document.createElement("button");
    button.textContent = model;
    button.classList.add("model-button");
    button.classList.add("selected");
    button.onclick = () => toggleModelSelection(model, button);
    container.appendChild(button);
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
      console.log(data);
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

        const formattedResponse = result.response.replace(
          /\*\*(.*?)\*\*/g,
          "<b>$1</b>"
        );

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

document.getElementById("query").addEventListener("keydown", (event) => {
  const queryInput = document.getElementById("query");
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    document.getElementById("submit").click();
  } else if (event.key === "Enter" && event.shiftKey) {
    const cursorPosition = queryInput.selectionStart;
    queryInput.value =
      queryInput.value.slice(0, cursorPosition) +
      "\n" +
      queryInput.value.slice(cursorPosition);
    event.preventDefault();
    queryInput.selectionStart = queryInput.selectionEnd = cursorPosition + 1;
  }
});

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

loadModels(() => {
  createModelButtons(); // Now create buttons after models are loaded
});
