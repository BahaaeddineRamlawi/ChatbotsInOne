const keyboardIcon = document.getElementById("keyboard");
const photo_libraryIcon = document.getElementById("photo_library");
const keyboardContent = document.getElementById("keyboard-content");
const photo_libraryContent = document.getElementById("photo_library-content");

function temp(){
  keyboardContent.style.display = "flex";
  photo_libraryContent.style.display = "none";
  keyboardIcon.classList.add("active");
  photo_libraryIcon.classList.remove("active");
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
}

temp();

keyboardIcon.addEventListener("click", () => {
  temp();
});

photo_libraryIcon.addEventListener("click", () => {
  keyboardContent.style.display = "none";
  photo_libraryContent.style.display = "flex";
  keyboardIcon.classList.remove("active");
  photo_libraryIcon.classList.add("active");
  document.getElementById("image-prompt").addEventListener("keydown", (event) => {
    const queryInput = document.getElementById("image-prompt");
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      document.getElementById("submit_prompt").click();
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
});
