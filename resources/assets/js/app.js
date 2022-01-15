ipc.on("login.done", (evt, data) => {
    if (!data.discord) {
        discordLogin();
    }

    var javaHome = localStorage.getItem("javaHome");
    if (!java(javaHome)) localStorage.setItem("javaHome", data.javaHome);
    localStorage.setItem("ram", data.ram);

    if (data.auth) localStorage.setItem("auth", JSON.stringify(data.auth));
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

    localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user")), discord: data.discord }));

    load();
});

ipc.on("discord-auth.done", (evt, data) => {
    if (!data) return;
    var str = "";
    if (lang == "fr") str = "Votre compte discord est maintenant lié à minecraft, son token d'accès a été révoqué à l'instant.";
    else str = "Your discord account is now linked to minecraft, its access token has been deleted.";

    if (data.addToServer) {
        if (lang == "fr") str += " Vous avez été rajouté au serveur discord New Empires.";
        else str += " You have been added to discord server New Empires.";
    }
    popup("valid", str);

    localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user")), discord: data.discord }));
});

ipc.on("discord-auth.error", (evt, err) => {
    var err = getMessageError(err);

    var content = document.createElement("div");
    var txt = document.createElement("p");
    txt.innerText = err;
    var a = document.createElement("a");
    a.id = "discord-login";
    a.href = "https://discord.com/api/oauth2/authorize?client_id=918066264029671494&redirect_uri=http%3A%2F%2Flocalhost%3A65230%2Fdiscord-auth&response_type=code&scope=identify%20guilds%20guilds.join"/* https://discord.com/api/oauth2/authorize?client_id=914936766744629330&redirect_uri=http%3A%2F%2Flocalhost%3A65230%2Fdiscord-auth&response_type=code&scope=identify%20guilds%20guilds.join */;
    a.target = "external";
    var img = document.createElement("img");
    img.width = "40";
    img.src = "./assets/images/large-discord.png";
    var span = document.createElement("span");
    span.innerText = lang == "fr" ? "Se connecter avec discord" : "Login with discord";
    a.append(img, span);
    content.append(txt, a);

    popup("error", content, false, "error");

    reloadHyperLinks();
});

function load() {
    if (localStorage.getItem("user")) {
        document.querySelectorAll("[replace='playerName']").forEach(el => {
            el.innerHTML = JSON.parse(localStorage.getItem("user")).name;
        });

        document.querySelectorAll("img[replace='srcPlayerHead']").forEach(el => {
            el.src = "http://cravatar.eu/helmavatar/" + JSON.parse(localStorage.getItem("user")).name + "/64.png"
        });

        document.querySelectorAll("img[replace='srcPlayerBody']").forEach(el => {
            el.src = "https://minotar.net/armor/body/" + JSON.parse(localStorage.getItem("user")).name + "/256.png";
        });

        document.querySelectorAll("[replace='valueDiscordAccount']").forEach(el => {
            el.value = JSON.parse(localStorage.getItem("user")).discord;
        });
    }
    loadSettings();
}

function loadSettings() {
    if (localStorage.getItem("javaHome")) javaPath.value = localStorage.getItem("javaHome");
    if (localStorage.getItem("ram-allocated")) setRam(localStorage.getItem("ram-allocated"));
    else if (localStorage.getItem("ram")) setDefaultRam();
    if (localStorage.getItem("resolution")) {
        var res = JSON.parse(localStorage.getItem("resolution"));
        if (res) {
            if (res.x == res.y && typeof res.x == "string") {
                resX.placeholder = "<" + res.x + ">";
                resY.placeholder = "<" + res.y + ">";
                resX.value = "";
                resY.value = "";
                resX.disabled = true;
                resY.disabled = true;
            }
            else {
                resX.value = res.x;
                resY.value = res.y;
                resX.placeholder = "";
                resY.placeholder = "";
                resX.disabled = false;
                resY.disabled = false;
            }
        }

    }
}

function discordLogin() {
    var content = document.createElement("div");
    var txt = document.createElement("p");
    txt.innerText = lang == "fr" ? "Vous devez lier un compte discord à minecraft" : "You must to link your discord account to minecraft";
    var a = document.createElement("a");
    a.id = "discord-login";
    a.href = "https://discord.com/api/oauth2/authorize?client_id=918066264029671494&redirect_uri=http%3A%2F%2Flocalhost%3A65230%2Fdiscord-auth&response_type=code&scope=identify%20guilds%20guilds.join"/* https://discord.com/api/oauth2/authorize?client_id=914936766744629330&redirect_uri=http%3A%2F%2Flocalhost%3A65230%2Fdiscord-auth&response_type=code&scope=identify%20guilds%20guilds.join */;
    a.target = "external";
    var img = document.createElement("img");
    img.width = "40";
    img.src = "./assets/images/large-discord.png";
    var span = document.createElement("span");
    span.innerText = lang == "fr" ? "Se connecter avec discord" : "Login with discord";
    a.append(img, span);
    content.append(txt, a);

    popup("warning", content, false);

    reloadHyperLinks();
}

document.body.addEventListener("wheel", ev => {
    if (ev.target.nodeName == "BODY" || ev.target.classList.contains("hidden-settings") || ev.path.find(a => a.id == "settings")) {
        var settings = document.getElementById("settings");
        var arrow = document.getElementById("arrow-settings");
        if (ev.wheelDeltaY <= -100 && settings.classList.contains("hidden") && document.getElementsByClassName("hidden-settings").length == 0) {
            loadSettings();
            addErrored();
            hiddenTab("hidden-settings", 3);
            settings.classList.remove("hidden");
            settings.animate([{
                transform: "translate(-50%, 50%)"
            },
            {
                transform: "translate(-50%, -50%)"
            }], { duration: 300 });

            arrow.animate([{ transform: "translateX(-50%) rotate(0)" }, { transform: "translateX(-50%) rotate(180deg)" }], { duration: 200 }).onfinish = () => {
                arrow.style.animationName = "arrow-rotated";
            }
        }

        if (ev.wheelDeltaY >= 100 && settings.getAnimations().length == 0 && !settings.classList.contains("hidden") && document.getElementsByClassName("hidden-settings")[0]?.getAnimations().length == 0) {
            var v = wantToQuit();
            if (v == "changes" || v == "errors") {
                if (!document.getElementById("popup-changes")) return popup("error", lang == "fr" ? "Êtes vous sûr de vouloir quitter sans enregistrer ?" : "Are you sure you want to quit without saving ?", true, "popup-changes", 4, true, () => {
                    closeSettings();
                });
                else return;
            }
            closeSettings();
        }
    }
});

function closeSettings() {
    var settings = document.getElementById("settings");
    var arrow = document.getElementById("arrow-settings");
    var tabs = document.getElementsByClassName("hidden-settings");
    for (var a = 0; a < tabs.length; a++) {
        var tab = tabs.item(a);
        tab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, direction: "reverse" }).onfinish = () => tab.remove();
    }
    settings.animate([{
        transform: "translate(-50%, 50%)"
    },
    {
        transform: "translate(-50%, -50%)"
    }], { duration: 300, direction: "reverse" }).onfinish = () => settings.classList.add("hidden");

    arrow.animate([{ transform: "translateX(-50%) rotate(180deg)" }, { transform: "translateX(-50%) rotate(0)" }], { duration: 300 }).onfinish = () => {
        arrow.style.animationName = "arrow";
    }
}

const ramSpan = document.getElementById("ram-allocated");
const ramField = document.getElementById("ram-selector");
const javaPath = document.getElementById("java-path");
const javaPathReset = document.getElementById("java-path-reset");
const resSelect = document.getElementById("resolution-select");
const resX = document.getElementById("resolution-x");
const resY = document.getElementById("resolution-y");
const saveBtn = document.getElementById("btn-save");

saveBtn.addEventListener("click", () => {
    var u = updateSettings();
    if (u.errors.length > 0) {
        u.errors.forEach(f => {
            if (!f.classList.contains("shake-anim")) f.classList.add("shake-anim");
            f.onanimationend = () => f.classList.remove("shake-anim");
        });
    }
    else saveSettings();
});

function saveSettings() {
    localStorage.setItem("ram-allocated", ramField.value);
    localStorage.setItem("javaHome", javaPath.value);
    localStorage.setItem("resolution", JSON.stringify({ x: resX.value || resX.placeholder.replace(/<|>/g, ""), y: resY.value || resY.placeholder.replace(/<|>/g, "") }))

    closeSettings();
}

ramField.addEventListener("input", () => {
    setRam(ramField.value);
    addErrored();
});
javaPath.addEventListener("input", addErrored);
resSelect.addEventListener("change", () => {
    var v = resSelect.value;

    if (v.includes(" x ")) {
        resX.placeholder = "";
        resY.placeholder = "";
        resX.value = v.split(" x ")[0];
        resY.value = v.split(" x ")[1];
        resX.disabled = false;
        resY.disabled = false;
    }
    else {
        resX.value = "";
        resY.value = "";
        resX.disabled = true;
        resY.disabled = true;
        resX.placeholder = "<" + v + ">";
        resY.placeholder = "<" + v + ">";
    }

    addErrored();
    resSelect.value = "";
});
resX.addEventListener("input", addErrored);
resY.addEventListener("input", addErrored);
javaPathReset.addEventListener("click", () => {
    ipc.send("java-home.reset");
});

ipc.on("java-home.result", (ev, j) => {
    javaPath.value = j;
    addErrored();
});

function wantToQuit() {
    var u = updateSettings();
    if (u.errors.length > 0) return "errors";
    if (u.changes.length > 0) return "changes";
    return true;
}

function addErrored() {
    var fields = updateSettings();
    if (fields.changes) {
        fields.changes.forEach(f => {
            f.classList.remove("errored");
            f.classList.add("changed");
        });
    }
    if (fields.errors) {
        fields.errors.forEach(f => {
            f.classList.remove("changed");
            f.classList.add("errored");
        });
    }
    if (fields.goods) {
        fields.goods.forEach(f => {
            f.classList.remove("errored");
            f.classList.remove("changed");
        });
    }
}

function updateSettings() {
    var beforeRam = localStorage.getItem("ram-allocated");
    var beforeJavaPath = localStorage.getItem("javaHome");
    var beforeRes = JSON.parse(localStorage.getItem("resolution"));

    var ram = ramField.value;
    var path = javaPath.value;
    var res = { x: resX.value || resX.placeholder, y: resY.value || resY.placeholder };
    if (res.x == res.y && typeof res.x == "string") {
        res.x = res.x.replace(/<|>/g, "");
        res.y = res.x;
    }

    var maxRam = Math.floor(getRamOS() * 0.75);
    if (maxRam > 10) maxRam = 10;
    var minRam = 2;

    var errors = [];
    var g = [];
    var changes = [];

    if (ram < minRam || ram > maxRam) errors.push(ramField);
    else if (beforeRam != ram) changes.push(ramField);
    else g.push(ramField);

    if (!java(path)) errors.push(javaPath);
    else if (beforeJavaPath != path) changes.push(javaPath);
    else g.push(javaPath);

    if (!resolution(res)) errors.push(resSelect, resX, resY);
    else if (beforeRes.x != res.x || res.y != beforeRes.y) changes.push(resSelect, resX, resY);
    else g.push(resSelect, resX, resY);

    return { errors, goods: g, changes };
}

function setRam(ram) {
    var maxRam = Math.floor(getRamOS() * 0.75);
    if (maxRam > 10) maxRam = 10;
    var minRam = 2;

    if (ram >= minRam && ram <= maxRam && ramField.value != ram) ramField.value = ram;

    ramField.max = maxRam;

    ramSpan.innerText = ram + " Go / " + maxRam + " Go";

    if (ram <= 3) {
        ramSpan.classList.add("red");
        ramSpan.classList.remove("orange");
    }
    else if (ram == 4) {
        ramSpan.classList.remove("red");
        ramSpan.classList.add("orange");
    }
    else {
        ramSpan.classList.remove("red");
        ramSpan.classList.remove("orange");
    }
}

function setDefaultRam() {
    var r = getRamOS();
    if (r < 2) return popup("error", lang == "fr" ? "Vous n'avez pas assez de mémoire RAM ! (min 2 Go)" : "You don't have enough RAM memory ! (min 2 Go)", false);
    else if (Math.floor(getRamOS() * 0.75) > 6) localStorage.setItem("ram-allocated", 6);
    else localStorage.setItem("ram-allocated", Math.floor(getRamOS() * 0.75));

    setRam(localStorage.getItem("ram-allocated"));
}

function resolution(r) {
    if (!r) return false;
    var { x, y } = r;
    if (!x || !y) return false;
    if (x == y && (x == "fullscreen" || x == "auto")) return true;
    if (x >= 800 && x <= 2560 && y >= 600 && y <= 1440) return true;
    return false;
}

function getRamOS() {
    return localStorage.getItem("ram") / 1.074e+9 || 8;
}

var logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", () => {
    ipc.send("logout", JSON.parse(localStorage.getItem("auth")));

    clearStorage();
});

function java(java) {
    if (!java) return false;
    return fs.existsSync(java) && java.endsWith("java.exe");
}

/*function play() {
    var butt = document.getElementById("play");
    butt.disabled = true;
    butt.value = "Lancement...";
    document.querySelector("html").style.cursor = "progress";

    if (!java(localStorage.getItem("javaHome"))) {
        toggleSettings("open");
        return errorLaunch("Chemin java non trouvé");
    }

    ramUpdate();

    ipc.send("launch", { javaHome: localStorage.getItem("javaHome"), mem: localStorage.getItem("allowed_memory") });
}

ipc.on("launchResult", (evt, data) => {
    if (data.code != 200) {
        errorLaunch(data.message);
    }
});

function errorLaunch(err) {
    var butt = document.getElementById("play");
    butt.disabled = false;
    butt.value = "Jouer !";
    document.querySelector("html").style.cursor = "";

    document.getElementById("hidden-tab-settings").style.zIndex = "1";
    document.getElementById("hidden-tab-settings").style.opacity = "1";
    document.getElementById("hidden-tab-settings").style.backgroundColor = "rgba(0, 0, 0, 0.8)";

    document.getElementById("title-error").innerHTML = "Erreur de lancement";
    document.getElementById("content-error").innerHTML = err;
    document.getElementById("error-popup").style.display = "initial";
    setTimeout(() => document.getElementById("error-popup").style.opacity = 1, 1);
}*/