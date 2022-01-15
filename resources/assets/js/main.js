const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const loginBtn = document.getElementById("login");
const microsoftBtn = document.getElementById("microsoft");

emailField.placeholder = lang=="fr"?"Adresse email":"Username";
passwordField.placeholder = lang=="fr"?"Mot de passe":"Password";

ipc.on("updater.checking", (evt, status) => {
    showChecking();
});
ipc.on("updater.available", (evt, status) => {
    showUpdating();
});
ipc.on("updater.not-available", (evt, status) => {
    removePopupByID("checking");
    checked();
});
ipc.on("updater.downloaded", (evt, status) => {
    showInstalling();
});

function checked() {
    var auth = localStorage.getItem("auth");
    var email = localStorage.getItem("email");
    var user = localStorage.getItem("user");
    if (email) {
        emailField.value = email;
    }
    if (auth && user) ipc.send("login-token", { ...JSON.parse(auth), user: JSON.parse(user) });
    else {
        clearStorage();
        removeLoading();
    }
}

checked();

microsoftBtn.addEventListener("click", () => {
    ipc.send("login-microsoft");
    popup("information", { fr: "Connectez-vous à votre compte microsoft puis revenez ici", en: "Log into your microsoft account then come back here" }[lang], false)
});

loginBtn.addEventListener("click", () => {
    var email = emailField.value;
    var password = passwordField.value;

    if (!email || !password) return appendFlash("error-flash", "Veuillez compléter les champs !", 1500);

    if (!validEmail(email)) return appendFlash("error-flash", "Veuillez entrer une adresse email valide !", 1500);

    loading();

    loginBtn.innerText = "Connexion...";
    loginBtn.disabled = true;

    localStorage.setItem("email", email);

    ipc.send("login", { username: email, password, type: "mojang" });
});

ipc.on("login.error", (event, error) => {
    clearStorage();
    loginBtn.disabled = false;
    loginBtn.innerText = "Se connecter";
    popup("error", getMessageError(error), true, "error");
    removeLoading();
});

ipc.on("login-token.error", (evt, error) => {
    clearStorage();
    popup("error", getMessageError(error), true, "error");
    removeLoading();
});

ipc.on("login-microsoft.error", (evt, error) => {
    clearStorage();
    popup("error", error.error_description ? error.error_description : getMessageError(error), true, "error");
    removeLoading();
});

document.addEventListener("keypress", ev => {
    if (ev.key == "Enter" && document.getElementsByClassName("popup").length == 0 && document.getElementsByClassName("popup-tab").length == 0 && document.getElementsByClassName("hidden-tab").length == 0) {
        loginBtn.click();
    }
});

document.body.addEventListener("wheel", ev => {
    if (ev.target.nodeName == "BODY" || ev.target.classList.contains("hidden-activities") || ev.path.find(a => a.id == "activities")) {
        var activities = document.getElementById("activities");
        var arrow = document.getElementById("arrow-activities");
        if (ev.wheelDeltaY <= -100 && activities.classList.contains("hidden") && document.getElementsByClassName("hidden-activities").length == 0) {
            hiddenTab("hidden-activities");
            activities.classList.remove("hidden");
            activities.animate([{
                transform: "translate(-50%, 50%)"
            },
            {
                transform: "translate(-50%, -50%)"
            }], { duration: 300 });

            arrow.animate([{ transform: "translateX(-50%) rotate(0)" }, { transform: "translateX(-50%) rotate(180deg)" }], { duration: 200 }).onfinish = () => {
                arrow.style.animationName = "arrow-rotated";
            }
        }

        if (ev.wheelDeltaY >= 100 && activities.getAnimations().length == 0 && !activities.classList.contains("hidden") && document.getElementsByClassName("hidden-activities")[0]?.getAnimations().length == 0) {
            var tabs = document.getElementsByClassName("hidden-activities");
            for(var a = 0; a < tabs.length; a++) {
                var tab = tabs.item(a);
                tab.animate([{opacity: 0}, {opacity: 1}], {duration: 300, direction: "reverse"}).onfinish = () => tab.remove();
            }
            activities.animate([{
                transform: "translate(-50%, 50%)"
            },
            {
                transform: "translate(-50%, -50%)"
            }], { duration: 300, direction: "reverse" }).onfinish = () => activities.classList.add("hidden");

            arrow.animate([{ transform: "translateX(-50%) rotate(180deg)" }, { transform: "translateX(-50%) rotate(0)" }], { duration: 300 }).onfinish = () => {
                arrow.style.animationName = "arrow";
            }
        }
    }
});

function validEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        return true;
    }
    return false;
}