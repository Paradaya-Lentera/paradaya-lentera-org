function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  const svg = button.querySelector("svg");
  if (isPassword) {
    svg.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        `;
  } else {
    svg.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        `;
  }
}

function validatePasswordStrength(password) {
  const result = {
    strength: "lemah",
    score: 0,
    messages: [],
  };

  if (password.length >= 8) result.score++;
  else result.messages.push("Minimal 8 karakter");

  if (/[A-Z]/.test(password)) result.score++;
  else result.messages.push("Satu huruf besar");

  if (/[a-z]/.test(password)) result.score++;
  else result.messages.push("Satu huruf kecil");

  if (/\d/.test(password)) result.score++;
  else result.messages.push("Satu angka");

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.score++;
  else result.messages.push("Satu karakter spesial");

  if (result.score >= 4) result.strength = "kuat";
  else if (result.score >= 2) result.strength = "sedang";

  return result;
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Halaman autentikasi dimuat");
});
