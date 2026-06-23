const signupSection = document.getElementById("signup-section");
const signinSection = document.getElementById("signin-section");
const dashboardSection = document.getElementById("dashboard-section");

const showSigninBtn = document.getElementById("show-signin");
const showSignupBtn = document.getElementById("show-signup");

const signupForm = document.getElementById("signup-form");
const signinForm = document.getElementById("signin-form");

const signupMessage = document.getElementById("signup-message");
const signinMessage = document.getElementById("signin-message");
const dashboardMessage = document.getElementById("dashboard-message");

const welcomeMessage = document.getElementById("welcome-message");

const logoutBtn = document.getElementById("logout-btn");
const generateBtn = document.getElementById("generate-btn");
const saveCaptionBtn = document.getElementById("save-caption-btn");

const captionPrompt = document.getElementById("caption-prompt");
const generatedCaption = document.getElementById("generated-caption");
const savedCaptionsList = document.getElementById("saved-captions-list");

let currentCaption = "";

function showSignup() {
  signupSection.classList.remove("hidden");
  signinSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
}

function showSignin() {
  signinSection.classList.remove("hidden");
  signupSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
}

function showDashboard(username) {
  dashboardSection.classList.remove("hidden");
  signupSection.classList.add("hidden");
  signinSection.classList.add("hidden");

  welcomeMessage.textContent = `Welcome, ${username}!`;
  loadCaptions();
}

showSigninBtn.addEventListener("click", showSignin);
showSignupBtn.addEventListener("click", showSignup);

signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const response = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, password })
  });

  const data = await response.json();

  if (data.success) {
    signupMessage.textContent = "Account created. Please sign in.";
    signupForm.reset();
    showSignin();
  } else {
    signupMessage.textContent = data.message;
  }
});

signinForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;

  const response = await fetch("/api/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    signinForm.reset();
    showDashboard(data.username);
  } else {
    signinMessage.textContent = data.message;
  }
});

logoutBtn.addEventListener("click", async function () {
  await fetch("/api/logout", {
    method: "POST"
  });

  currentCaption = "";
  generatedCaption.textContent = "Your AI caption will appear here.";
  dashboardMessage.textContent = "";
  showSignin();
});

generateBtn.addEventListener("click", async function () {
  const prompt = captionPrompt.value.trim();

  if (!prompt) {
    dashboardMessage.textContent = "Please enter what you need a caption for.";
    return;
  }

  generatedCaption.textContent = "Generating...";
  dashboardMessage.textContent = "";
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";

  try {
    let response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    let data = await response.json();

    if (!data.success) {
      response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      data = await response.json();
    }

    if (data.success) {
      currentCaption = data.caption;
      generatedCaption.textContent = data.caption;
      dashboardMessage.textContent = "";
    } else {
      generatedCaption.textContent = "Something went wrong.";
      dashboardMessage.textContent = "The AI request failed. Please try again.";
    }
  } catch (error) {
    generatedCaption.textContent = "Something went wrong.";
    dashboardMessage.textContent = "The AI request failed. Please try again.";
  }

  generateBtn.disabled = false;
  generateBtn.textContent = "Generate Caption";
});

saveCaptionBtn.addEventListener("click", async function () {
  const prompt = captionPrompt.value.trim();

  if (!currentCaption) {
    dashboardMessage.textContent = "Generate a caption first.";
    return;
  }

  const response = await fetch("/api/captions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      generatedText: currentCaption
    })
  });

  const data = await response.json();

  if (data.success) {
    dashboardMessage.textContent = "Caption saved.";
    loadCaptions();
  } else {
    dashboardMessage.textContent = data.message;
  }
});

async function loadCaptions() {
  const response = await fetch("/api/captions");
  const data = await response.json();

  savedCaptionsList.innerHTML = "";

  if (!data.success || data.captions.length === 0) {
    savedCaptionsList.innerHTML = "<p>No saved captions yet.</p>";
    return;
  }

  data.captions.forEach(function (caption) {
    const captionDiv = document.createElement("div");
    captionDiv.classList.add("saved-caption");

    captionDiv.innerHTML = `
      <p>${caption.generated_text}</p>
      <small>Prompt: ${caption.prompt}</small>
      <div class="caption-actions">
        <button class="edit-btn" onclick="editCaption(${caption.id}, '${escapeQuotes(caption.generated_text)}')">Edit</button>
        <button class="delete-btn" onclick="deleteCaption(${caption.id})">Delete</button>
      </div>
    `;

    savedCaptionsList.appendChild(captionDiv);
  });
}

async function editCaption(id, oldText) {
  const updatedText = prompt("Edit your caption:", oldText);

  if (!updatedText) {
    return;
  }

  const response = await fetch(`/api/captions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ generatedText: updatedText })
  });

  const data = await response.json();

  if (data.success) {
    dashboardMessage.textContent = "Caption updated.";
    loadCaptions();
  } else {
    dashboardMessage.textContent = data.message;
  }
}

async function deleteCaption(id) {
  const confirmDelete = confirm("Are you sure you want to delete this caption?");

  if (!confirmDelete) {
    return;
  }

  const response = await fetch(`/api/captions/${id}`, {
    method: "DELETE"
  });

  const data = await response.json();

  if (data.success) {
    dashboardMessage.textContent = "Caption deleted.";
    loadCaptions();
  } else {
    dashboardMessage.textContent = data.message;
  }
}

function escapeQuotes(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

async function checkSession() {
  const response = await fetch("/api/check-session");
  const data = await response.json();

  if (data.loggedIn) {
    showDashboard(data.username);
  } else {
    showSignup();
  }
}

checkSession();
