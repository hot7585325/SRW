
// document.getElementById('start-ar').addEventListener('click', async () => {
//   if (navigator.xr) {
//     const session = await navigator.xr.requestSession('immersive-ar', {
//       requiredFeatures: ['hit-test']
//     });

//     renderer.xr.setSession(session);
//   } else {
//     alert('你的裝置不支援 WebXR AR 模式，啟用QuickLook');
//   }
// });


navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
  if (supported) {
    console.log("支援 immersive-ar");
  } else {
    console.warn("不支援 immersive-ar");
  }
});


  document.getElementById("Home_button").addEventListener("click", function () {window.location.href='index.html' })