const { app, BrowserWindow, ipcMain, autoUpdater, shell } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const child = require('child_process');
const express = require("express");
const webApp = express();
webApp.listen(65230);
const axios = require("axios");
const jwt = require("jsonwebtoken");

var accessToken = "";

const RPC = require("discord-rpc");
const clientId = require("./tokens.json").clientID;
const client = new RPC.Client({ transport: 'ipc' });

/**
 * @type {RPC.Presence}
 */
const activity = {
    largeImageKey: "logo",
    largeImageText: "New Empires SMP/RPG",
    details: "multiplayer minecraft server",
    buttons: [
        {

            label: "Discord Server",
            url: require("./tokens.json").discordInvite
        }
    ],
    startTimestamp: new Date().getTime(),
    state: "In the Launcher",
    instance: true
}

client.on('ready', () => {
    client.setActivity(activity, process.pid);
});

client.login({ clientId });

webApp.get("*", (req, res, next) => {
    if (req.query.error && req.query.error_description) res.status(400).json({ ...req.query });
    else next();
});
webApp.get("/auth", (req, res) => {
    if (!req.query.code) return res.status(400).send("error");
    code = req.query.code;
    return res.redirect("/good");
});
webApp.get("/logout", (req, res) => {
    accessToken = "";
    res.status(200).send("logouted !");
});
webApp.get("/discord-auth", (req, res) => {
    if (!req.query.code) return res.status(400).send("error");
    const { code } = req.query;
    axios.post(AUTH_URL + "/discord-auth", { code, accessToken, redirectUri: req.protocol + "://" + req.headers.host + req.path }, { headers: { "Content-Type": "application/json" } }).then(data => {
        mainWindow.webContents.send("discord-auth.done", data.data);
    }).catch(err => {
        mainWindow.webContents.send("discord-auth.error", err.response.data || "Unexpected error");
    });
    return res.redirect("/good");
});
webApp.get("/good", (req, res) => {
    return res.status(200).send("You can close this page !");
});

if (require("electron-squirrel-startup")) return app.quit();

var isLaunched = false;
var javaHome;
require('find-java-home')({ allowJre: true }, (err, res) => {
    javaHome = path.join(res, "bin", "java.exe");
});

app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        createWindow();
    });
});

autoUpdater.setFeedURL({
    url: require("./tokens.json").updateUrl + "/" + os.platform() + "_" + os.arch() + "/" + app.getVersion()
});

/**
 * @type {BrowserWindow}
 */
var mainWindow;

const AUTH_URL = require("./tokens.json").authUrl;
const ROOT_PATH = path.join((process.env.APPDATA || (process.platform == 'darwin' ? path.join(process.env.HOME, "Library", "Preferences") : path.join(process.env.HOME, ".local", "share"))), ".new-empires-launcher");
const PACK_URL = require("./tokens.json").packUrl;
const RESOURCES_PATH = path.join(__dirname, "resources");
const ASSETS_PATH = path.join(RESOURCES_PATH, "assets");

function createWindow() {
    if (BrowserWindow.getAllWindows().length != 0) return;

    mainWindow = new BrowserWindow({
        title: "New Empires' launcher - " + app.getVersion(),
        icon: path.join(ASSETS_PATH, "images", "logo.jpg"),
        frame: true,
        height: 620,
        width: 1100,
        minWidth: 1024,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
        },
        maximizable: false,
        show: false
    });

    mainWindow.setBackgroundColor("#212121");
    //mainWindow.setMenu(null);
    mainWindow.setAspectRatio(1024 / 576);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
        /*autoUpdater.checkForUpdates();

        autoUpdater.addListener("checking-for-update", () => {
            mainWindow.webContents.send("updater.checking");
        });

        autoUpdater.addListener("update-available", () => {
            mainWindow.webContents.send("updater.available");
        });

        autoUpdater.addListener("update-not-available", () => {
            mainWindow.webContents.send("updater.not-available");
        });

        autoUpdater.on("update-downloaded", () => {
            mainWindow.webContents.send("updater.downloaded");

            autoUpdater.quitAndInstall();
        });*/
    });
}

app.on("window-all-closed", function () {
    if (process.platform != "darwin") app.quit();
});

ipcMain.on("login-microsoft", (evt, data) => {
    authentificate("microsoft").then(res => {
        if (!res) return;
        var user = { id: res.user.id, name: res.user.name };
        var auth = { accessToken: res.auth.access_token, type: "microsoft", refreshToken: res.refreshToken };
        accessToken = auth.accessToken;
        mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
            mainWindow.webContents.send("login.done", { user, ram: os.totalmem(), javaHome: javaHome, auth, discordLinked: res.discordLinked, type: res.type });
        });
    }).catch(err => {
        evt.sender.send("login-microsoft.error", err);
    });
});

ipcMain.on("logout", (evt, data) => {
    accessToken = "";
    if (data.type == "mojang") {
        axios.post("mojang/invalidate", { accessToken: data.accessToken, clientToken: data.clientToken }, { headers: { "Content-Type": "application/json" } }).then(() => {
            mainWindow.loadURL(path.join(RESOURCES_PATH, "index.html")).then(() => {
                mainWindow.webContents.send("logout.done");
            });
        }).catch(console.error);
    }
    else if (data.type == "microsoft") {
        mainWindow.loadURL(path.join(RESOURCES_PATH, "index.html")).then(() => {
            mainWindow.webContents.send("logout.done");
        });
    }
});

ipcMain.on("login", (evt, data) => {
    authentificate(data.type, data.username, data.password).then(account => {
        if (!account) return;
        if (!account.selectedProfile) return evt.sender.send("login.error", { error: "InvalidMinecraftLicense", errorMessage: "no-message" });
        mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
            accessToken = account.accessToken;
            mainWindow.webContents.send("login.done", { user: account.selectedProfile, ram: os.totalmem(), javaHome: javaHome, auth: { accessToken: account.accessToken, clientToken: account.clientToken, type: "mojang" }, discordLinked: account.discordLinked, type: account.type });
        });
    }).catch(err => {
        evt.sender.send("login.error", err);
    });
});

ipcMain.on("java-home.reset", (ev) => {
    ev.sender.send("java-home.result", javaHome);
});

ipcMain.on("login-token", (evt, auth) => {
    if (!auth || !auth.user) return;
    if (!accessToken) accessToken = auth.accessToken;
    if (auth.type == "mojang") {
        axios.post(AUTH_URL + "/mojang/token", { accessToken: auth.accessToken, clientToken: auth.clientToken }, { headers: { "Content-Type": "application/json" } }).then(data => {
            if (!data || !data.data) return;
            data = data.data;
            mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
                if (data.type == "refresh") accessToken = data.accessToken;
                mainWindow.webContents.send("login.done", { ...(data.type == "refresh" ? { user: data.selectedProfile, ram: os.totalmem(), javaHome, auth: { accessToken: data.accessToken, clientToken: data.clientToken, type: "mojang" } } : {}), discordLinked: data.discordLinked, type: data.type });
            });
        }).catch(err => {
            if (!err || !err.response) return evt.sender.send("login-token.error", "Unexpected error");
            evt.sender.send("login-token.error", err.response.data);
        });
    }
    else if (auth.type == "microsoft") {
        axios.post(AUTH_URL + "/microsoft/token", { accessToken: auth.accessToken, refreshToken: auth.refreshToken }, { headers: { "Content-Type": "application/json" } }).then(data => {
            if (!data || !data.data) return;
            data = data.data;
            if (data.type == "refresh") {
                var user = { id: data.user.id, name: data.user.name };
                var auth = { accessToken: data.auth.access_token, type: "microsoft", refreshToken: data.refreshToken };
                accessToken = auth.accessToken;
            }
            mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
                mainWindow.webContents.send("login.done", { ...(data.type == "refresh" ? { user, ram: os.totalmem(), javaHome, auth } : {}), discordLinked: data.discordLinked, type: data.type });
            });
        }).catch(err => {
            if (!err || !err.response) return evt.sender.send("login-token.error", "Unexpected error");
            evt.sender.send("login-token.error", err.response.data);
        });
    }
});

function javaVersion(java) {
    return new Promise((resolve, reject) => {
        var spawn = child.spawn(java || "java", ['-version']);
        spawn.on('error', function (err) {
            return reject(err);
        })
        spawn.stderr.on('data', function (data) {
            data = data.toString().split('\n')[0];
            var javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
            if (javaVersion) {
                return resolve(javaVersion);
            } else {
                return reject("Wrong java !");
            }
        });
    });
}

ipcMain.on("launch", (evt, data) => {
    /*if (isLaunched) return;
    if (!data) return mainWindow.webContents.send("launch.error", "messages.error.launch.unexpected");

    javaVersion(data.javaHome).then(() => {
        data.mem = parseInt(data.mem);
        if (!Number.isInteger(data.mem) || data.mem < 2 || data.mem > 10) return mainWindow.webContents.send("launch.error", "messages.error.launch.ram");

        var auth = getAuth();

        const launcher = new Client();

        try {
            if (fs.existsSync(path.join(ROOT_PATH, "mods"))) {
                rmDirNotEmpty(path.join(ROOT_PATH, "mods"));
            }
        } catch (error) {
            return mainWindow.webContents.send("launch.error", "messages.error.launch.permission");
        }

        const args = {
            authorization: auth,
            javaPath: data.javaHome,
            memory: { min: data.mem + "G", max: data.mem + "G" },
            root: ROOT_PATH,
            version: { number: "1.16.5", type: "release" },
            clientPackage: PACK_PATH,
            forge: path.join(ROOT_PATH, "forge.jar"),
            removePackage: true,
        };

        console.error("[Server/INFO] lauch args: " + JSON.stringify(args));

        launcher.launch(args)
            .catch(err => {
                console.error("[Server/ERROR] " + err);
                isLaunched = false;
                if (mainWindow.webContents.getURL().includes("download.html")) {
                    mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
                        mainWindow.webContents.send("launch.error", "messages.error.launch.unexpected");
                    });
                } else {
                    mainWindow.webContents.send("launch.error", "messages.error.launch.unexpected");
                }
            });

        var timeout;
        var nbData = 0;

        launcher.addListener("data", (data) => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    if (nbData < 10) {
                        isLaunched = false;
                        if (mainWindow.webContents.getURL().includes("download.html")) {
                            mainWindow.loadURL(path.join(RESOURCES_PATH, "app.html")).then(() => {
                                mainWindow.webContents.send("launch.error", "messages.error.launch.unexpected");
                            });
                        } else {
                            mainWindow.webContents.send("launch.error", "messages.error.launch.unexpected");
                        }
                    } else mainWindow.close();
                }, 5000);
            }

            console.log("[Server/DATA] " + data);

            nbData++;
        });

        launcher.addListener("progress", (data) => {
            mainWindow.webContents.send("launch.progress", data);
        });

        launcher.addListener("download-status", (data) => {
            mainWindow.webContents.send("launch.download.status", data);
        });

        isLaunched = true;
        mainWindow.loadURL(path.join(RESOURCES_PATH, "download.html"));
    }).catch(() => {
        mainWindow.webContents.send("launch.error", "messages.error.launch.java-not-found");
    });*/
});

var code = "";

const config = {
    auth: {
        clientId: require("./tokens.json").clientIDAzure
    }
};

const authCodeUrlParameters = {
    redirectUri: "http://localhost:65230/auth",
    scopes: ["XboxLive.signin", "offline_access"]
};

function authentificate(type, username = null, password = null) {
    return new Promise(async (res, rej) => {
        if (type == "mojang") {
            axios.post(AUTH_URL + "/mojang/login", {
                username,
                password
            }, { headers: { "Content-Type": "application/json" } }).then(r => {
                if (!r) return rej();
                res(r.data);
            }).catch(err => {
                if (!err || !err.response) return rej("Unexpected error");
                rej(err.response.data);
            });
        } else if (type == "microsoft") {
            code = "";
            var url = `https://login.live.com/oauth20_authorize.srf?client_id=${config.auth.clientId}&redirect_uri=${authCodeUrlParameters.redirectUri}&scope=${authCodeUrlParameters.scopes.join(" ")}&response_type=code`.replace(" ", "%20");
            shell.openExternal(url).catch(rej);

            var exp = new Date();
            exp.setMinutes(exp.getMinutes() + 10);

            var int = setInterval(() => {
                if (exp.getTime() < new Date().getTime()) {
                    rej({ error: "ExpireLogin", errorMessage: "no-message" });
                    code = "";
                    clearInterval(int);
                    return;
                }
                else if (code) {
                    microsoftRequests(code).then(res).catch(rej);

                    code = "";
                    clearInterval(int);
                }
            }, 1000);
        }
    });
}

function microsoftRequests(code) {
    return new Promise((res, rej) => {
        axios.post(AUTH_URL + "/microsoft/login", { flow: code }, { headers: { "Content-Type": "application/json" } }).then(r => {
            if (!r) return rej();
            res(r.data);
        }).catch(err => {
            if (!err || !err.response) return rej("Unexpected error");
            rej(err.response.data);
        });
    });
}