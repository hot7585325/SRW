const mainBtn = document.querySelector("#mainBtn");
const left_panel = document.getElementById("left_panel");

let left_panel_Toggle = false;


mainBtn.addEventListener("click", () => {

    SwitchAni_left_panel(left_panel)
});



function SwitchAni_left_panel(DOM) {
    left_panel_Toggle = !left_panel_Toggle
    if (left_panel_Toggle) {
        DOM.style.animation = "none";
        void DOM.offsetWidth;
        DOM.style.animation = "ani_left_panel 1s ease forwards";
    } else {
        DOM.style.animation = "none";
        void DOM.offsetWidth;
        DOM.style.animation = "ani_left_panel 1s ease forwards reverse";
    }
}