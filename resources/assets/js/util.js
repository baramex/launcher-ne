const electron = require("electron");
const ipc = electron.ipcRenderer;
const { shell } = electron;
const fs = require("fs");

document.body.style.backgroundImage = `url(./assets/images/backgrounds/${random(fs.readdirSync(__dirname + "/assets/images/backgrounds"))})`;

function random(array) {
    return array[Math.random() * array.length | 0];
}

var lang = localStorage.getItem("lang");
if (lang != "fr" && lang != "en") { setLang("en") };
if (lang != document.body.getAttribute("lang")) { setLang(lang); }

function setLang(l) {
    localStorage.setItem("lang", l);
    lang = l;
    document.body.lang = l;
}

function getMessageError(error) {
    if (!error.error || !error.errorMessage) return "Unexpected error";
    if (messages[error.error]) return messages[error.error][lang] || messages[error.error].find(a => a.message == error.errorMessage)[lang] || "Unexpected error";
    return "Unexpected error";
}

/*updateSelector(false);

if (document.getElementById("select-mode"))
    document.getElementById("select-mode").addEventListener("click", () => {
        updateSelector();
    });

function updateSelector(isChange = true) {
    if (document.getElementById("select-mode")) {
        document.getElementById("select-mode").querySelectorAll("div").forEach(el => {
            if (el.className == "selector") {
                if (localStorage.getItem("data-theme") == "dark") {
                    if (isChange) {
                        localStorage.setItem("data-theme", "light");
                        el.style.left = "50%";
                    } else el.style.left = "0%";
                } else {
                    if (isChange) {
                        localStorage.setItem("data-theme", "dark");
                        el.style.left = "0%";
                    } else el.style.left = "50%";
                }
                return "break";
            }
        });
    }
    if (localStorage.getItem("data-theme") == "dark") document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.setAttribute('data-theme', 'light');
}*/

function clearStorage() {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
}

function showChecking() {
    removePopupByID("checking")

    popup("loading", "Vérification des mises à jour", false, "checking");
}

function showUpdating() {
    removePopupByID("checking");
    removePopupByID("downloading");

    popup("loading", "Téléchargement de la nouvelle version", false, "downloading");
}

function showInstalling() {
    removePopupByID("checking");
    removePopupByID("downloading");
    removePopupByID("installing");

    popup("loading", "Installation du nouveau launcher", false, "installing");
}

function removePopupByID(id) {
    var popup = document.getElementById(id);
    var tab = document.getElementById(id + "_tab");
    if (popup && tab) removePopup(popup, tab);
}

function removePopup(popup, tab) {
    popup.remove();
    tab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, direction: "reverse" }).onfinish = () => tab.remove();
}

function popup(type, message, canBeClosed = true, id = null, customZ = 1, canBeCanceled = false, closeCallback = null) {
    document.getElementsByClassName("popup")[0]?.remove();

    var tab = document.getElementById("loading-circle_tab") || hiddenTab("popup-tab", customZ);
    tab.style.zIndex = customZ;
    tab.className = "hidden-tab popup-tab";

    var popup = document.createElement("div");
    if (id) popup.id = id;
    if (id) tab.id = id + "_tab";
    popup.classList.add("popup", "center-abs", "borderR", "LaPadding");

    var header = document.createElement("header");
    if (type != "loading") {
        var img = document.createElement("img");
        img.src = "./assets/images/popup/" + type + ".png";
        header.appendChild(img);
    } else {
        header.innerHTML = `<progress class="pure-material-progress-circular"></progress>`;
    }

    if (typeof message == "string" || !message || typeof message == "number") {
        var content = document.createElement("p");
        content.innerText = message;
    }
    else {
        content = message;
    }

    popup.append(header, content);

    if (canBeClosed) {
        var close = document.createElement("img");
        close.src = "./assets/images/close.png";
        close.classList.add("closeBtn");
        close.onclick = () => {
            if (closeCallback) closeCallback();
            removePopup(popup, tab);
        };
        popup.appendChild(close);

        var button = document.createElement("button");
        button.classList.add("btn", "btn-valid", "reset", "borderR", "anim", "pointer");
        button.innerText = "Ok";
        button.onclick = close.onclick;

        if (canBeCanceled) {
            var container = document.createElement("div");
            container.classList.add("grid-button")

            var button1 = document.createElement("button");
            button1.classList.add("btn", "btn-cancel", "reset", "borderR", "anim", "pointer");
            button1.innerText = "Cancel";
            button1.onclick = () => removePopup(popup, tab);

            container.append(button1, button);

            popup.appendChild(container);
        }
        else {
            popup.appendChild(button);
        }
    }

    document.body.appendChild(popup);

    return popup;
}

document.addEventListener("keypress", ev => {
    if (ev.key == "Enter" && document.getElementsByClassName("popup")[0]?.querySelector(".closeBtn")) {
        removeLastPopup();
    }
});

function removeLastPopup() {
    if (document.getElementsByClassName("popup").length > 0 && document.getElementsByClassName("popup-tab").length > 0) removePopup(document.getElementsByClassName("popup")[0], document.getElementsByClassName("popup-tab")[0]);
}

function loading() {
    document.getElementById("loading-circle")?.remove();
    document.getElementById("loading-circle_tab")?.remove();

    hiddenTab().id = "loading-circle_tab";

    var p = document.createElement("progress");
    p.classList.add("pure-material-progress-circular", "loading");
    p.id = "loading-circle";

    document.body.appendChild(p);
}

function removeLoading() {
    var c = document.getElementById("loading-circle");
    var tab = document.getElementById("loading-circle_tab");

    if (c) c.remove();
    if (tab) tab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, direction: "reverse" }).onfinish = () => tab.remove();
}

function hiddenTab(className = null, customZ = 1) {
    var tab = document.createElement("div");
    tab.classList.add("hidden-tab");
    tab.style.zIndex = customZ;
    if (className) tab.classList.add(className);
    document.body.appendChild(tab);

    tab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });

    return tab;
}

document.body.onload = () => {
    reloadHyperLinks();
};

function reloadHyperLinks() {
    document.querySelectorAll("a[target='external']").forEach(el => {
        el.addEventListener("click", ev => {
            ev.preventDefault();
            shell.openExternal(el.href);
        });
    });
}