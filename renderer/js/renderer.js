const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const fileName = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

// Function that loads image
function loadImage(e) {
  const file = e.target.files[0];

  if (!isFile(file)) {
    showToastAlert("Please select an image", "error");
    return;
  }

  const image = new Image();

  image.src = URL.createObjectURL(file);
  image.onload = function () {
    widthInput.value = this.width;
    heightInput.value = this.height;
  };

  form.style.display = "block";
  fileName.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), "image-resizer");
}

// Toast alert
function showToastAlert(message, type) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: (type = "error" ? "red" : "green"),
      color: "white",
      textAlign: "center",
    },
  });
}

// form submit handler
function sendImage(e) {
  e.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path;

  if (!img.files[0]) {
    showToastAlert("Please upload an image", "error");
    return;
  }

  if (width === "" || height === "") {
    showToastAlert("Please insert height and width!");
    return;
  }

  // send to main ipcRenderer
  ipcRenderer.send("image:resize", {
    imgPath,
    width,
    height,
  });
}

// function for checking the file
function isFile(file) {
  const acceptedTypes = [
    "image/gif",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/jpg",
  ];
  return file && acceptedTypes.includes(file["type"]);
}

img.addEventListener("change", loadImage);
form.addEventListener("submit", sendImage);

// catch the image done
ipcRenderer.on("image:done", () => {
  showToastAlert(`Image resized to ${widthInput.value} x ${heightInput.value}`);
});
