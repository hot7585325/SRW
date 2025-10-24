
//#region 網格資訊區

const info_button = document.getElementById("info_button")
const info_Panel = document.getElementById("info_Panel")
const info_1 = document.getElementById("info_1")
const info_2 = document.getElementById("info_2")
const info_3 = document.getElementById("info_3")
const info_4 = document.getElementById("info_4")
const info_5 = document.getElementById("info_5")
const info_6 = document.getElementById("info_6")

// info_button.addEventListener("click", () => { info_Panel.style.display = "none"; console.log("關閉info_Panel") })
// info_button.addEventListener("click", () => { info_1.style.display = "none"; console.log("關閉物件資訊_info_1") })
// info_button.addEventListener("click", () => { info_2.style.display = "none"; console.log("關閉物件資訊_info_2") })
// info_button.addEventListener("click", () => { info_3.style.display = "none"; console.log("關閉物件資訊_info_3") })
// info_button.addEventListener("click", () => { info_4.style.display = "none"; console.log("關閉物件資訊_info_4") })
// info_button.addEventListener("click", () => { info_5.style.display = "none"; console.log("關閉物件資訊_info_5") })
// info_button.addEventListener("click", () => { info_6.style.display = "none"; console.log("關閉物件資訊_info_6") })
//#endregion




//#region 按鈕Panel
document.getElementById("Ani_button").addEventListener("click", function () {
  const Ani_text = document.getElementById("Ani_text");
  Ani_text.textContent = Ani_text.textContent === "動畫播放" ? "動畫停止" : "動畫播放";
});

document.getElementById("Name_button").addEventListener("click", function () {
  const Name_text = document.getElementById("Name_text");
  Name_text.textContent = Name_text.textContent === "名稱顯示" ? "名稱關閉" : "名稱顯示";
});

document.getElementById("Home_button").addEventListener("click", function () {
window.location.href='index.html'
});

//#endregion



