const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");
const { BrowserWindow, app, Menu, ipcMain, shell } = require("electron");

process.env.NODE_ENV = "production";

const IS_DEV = process.env.NODE_ENV !== "production";
const IS_MAC = process.platform === "darwin";

let mainWindow;

// Creating the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image Resizer",
    width: IS_DEV ? 1000 : 500,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (IS_DEV) {
    mainWindow.webContents.openDevTools();
  }

  // This is the path where the function load the file
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// Creating the about window
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About Image Resizer",
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// Menu template
const menu = [
  ...(IS_MAC
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!IS_MAC
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

// This is the function that will be called when the app is ready
app.whenReady().then(() => {
  createMainWindow();

  // Implementing main menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // remove mainWindow from memory on close
  mainWindow.on("closed", () => (mainWindow = null));

  // This will create the browser window when the app is ready
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Listen to the ipc renderer message and act accordingly
ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "image-resizer");

  resizeImage(options);
});

async function resizeImage({ imgPath, width, height, dest }) {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: Number(width),
      height: Number(height),
    });

    // create filename
    const fileName = path.basename(imgPath);

    // create destination folder if not exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    // write file to dest
    fs.writeFileSync(path.join(dest, fileName), newPath);

    // send success message to renderer
    mainWindow.webContents.send("image:done");

    // open destination folder
    shell.openPath(dest);
  } catch (error) {
    console.log(error);
  }
}

app.on("window-all-closed", () => {
  if (!IS_MAC) {
    app.quit();
  }
});
