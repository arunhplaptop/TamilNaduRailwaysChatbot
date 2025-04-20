// public/chat.js (final working version)

function sendMessage() {
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  displayMessage("You", userInput);

  fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userInput })
  })
  .then(res => res.json())
  .then(data => {
    displayMessage("Bot", data.reply);

    if (data.redirect) {
      window.location.href = data.redirect;
    }
  });

  document.getElementById("userInput").value = "";
}

function displayMessage(sender, message) {
  const chatBox = document.getElementById("chatBox");
  const messageElem = document.createElement("div");
  messageElem.className = sender.toLowerCase();
  messageElem.innerText = `${sender}: ${message}`;
  chatBox.appendChild(messageElem);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Enter key listener
document.getElementById("userInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("sendButton").click();
  }
});
