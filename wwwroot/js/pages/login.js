/**
 * Login Page Script
 * Login/Register form handling
 */

let isLoginMode = true;

function showLogin() {
  isLoginMode = true;
  document.getElementById("loginToggle").classList.add("active");
  document.getElementById("registerToggle").classList.remove("active");
  document.getElementById("nameGroup").classList.add("hidden");
  document.getElementById("confirmPasswordGroup").classList.add("hidden");
  document.getElementById("forgotPassword").style.display = "block";
  document.getElementById("submitBtn").textContent = "Masuk";
  document.getElementById("footerText").textContent = "Belum punya akun? ";
  document.getElementById("footerLink").textContent = "Daftar";
}

function showRegister() {
  isLoginMode = false;
  document.getElementById("loginToggle").classList.remove("active");
  document.getElementById("registerToggle").classList.add("active");
  document.getElementById("nameGroup").classList.remove("hidden");
  document.getElementById("confirmPasswordGroup").classList.remove("hidden");
  document.getElementById("forgotPassword").style.display = "none";
  document.getElementById("submitBtn").textContent = "Buat Akun";
  document.getElementById("footerText").textContent = "Sudah punya akun? ";
  document.getElementById("footerLink").textContent = "Masuk";
}

function toggleMode() {
  if (isLoginMode) {
    showRegister();
  } else {
    showLogin();
  }
}

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  const svg = button.querySelector("svg");
  if (isPassword) {
    svg.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>';
  } else {
    svg.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
  }
}

function handleSubmit() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("passwordError");

  if (isLoginMode) {
    console.log("Login:", { email, password });
    alert("Form login dikirim! Cek console untuk detailnya.");
  } else {
    const name = document.getElementById("name").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      errorDiv.textContent = "Password tidak cocok!";
      errorDiv.classList.remove("hidden");
      return;
    }

    errorDiv.classList.add("hidden");
    console.log("Register:", { name, email, password });
    alert("Form registrasi dikirim! Cek console untuk detailnya.");
  }
}

function socialLogin(provider) {
  console.log("Social login with:", provider);
  alert(`Login dengan ${provider} diklik!`);
}

document.addEventListener("keypress", function (e) {
  if (e.key === "Enter") handleSubmit();
});
