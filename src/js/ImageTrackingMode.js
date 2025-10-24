



//#region 圖片偵測顯示處理
const scan_Image = document.getElementById("scan")
const ButtonPanel = document.getElementById("ButtonPanel")
const Discripts = document.getElementById("Discripts")

window.addEventListener("targetfound-global-event", () => {
  scan_Image.style.display = "none"
  ButtonPanel.style.display = "flex";
  Discripts.style.display = "block"
  Ani_text.textContent = "動畫播放"
})

window.addEventListener("targetlost-global-event", () => {
  scan_Image.style.display = "block"
  ButtonPanel.style.display = "none";
  Discripts.style.display = "none"
})





//#region  點擊關閉-描述
Discripts.addEventListener("click", () => { Discripts.style.display = "none"; console.log("關閉操作描述") })
Discripts.addEventListener("touchstart", () => { Discripts.style.display = "none"; console.log("關閉操作描述") })
//#endregion

