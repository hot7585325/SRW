
//#region 測試冒泡

// 發射方
AFRAME.registerComponent('mp-emit', {
  init: function () {

    setTimeout(() => this.el.emit("emit-say", () => { console.log("發送事件"); }, true), 100);

    console.log(this.el.id + "的mp-emit組件");
  },
});


//接收方
AFRAME.registerComponent('mp-recive', {
  init: function () {
    console.log(this.el.id + "的mp-recive組件");
    this.el.addEventListener("emit-say", (e) => {
      console.log(this.el.id + "接收事件");
    })

  }
});

//#endregion

//#region 觸控旋轉縮放(AI)
/* global AFRAME, THREE */

/**
 * Touch and Mouse Drag-to-Rotate and Pinch-to-Scale Component for A-Frame.
 * @namespace aframe
 * @component touch-drag-rotate-scale
 * @author Gemini
 */
AFRAME.registerComponent('touch-drag-rotate-scale', {
  // ------------------ Schema: 定義組件可接受的屬性 ------------------
  schema: {
    /**
     * @property {number} rotationSpeed - 旋轉速度的靈敏度
     */
    rotationSpeed: { type: 'number', default: 0.5 },
    /**
     * @property {number} scaleSpeed - 縮放速度的靈敏度
     */
    scaleSpeed: { type: 'number', default: 0.05 },
    /**
     * @property {string} rotationCoordinate - 旋轉座標系統 ('local' 或 'world')
     * 'local': 物件會依據自身的軸向旋轉。
     * 'world': 物件會依據場景的世界軸向旋轉。
     */
    rotationCoordinate: { type: 'string', default: 'local', oneOf: ['local', 'world'] },
    /**
     * @property {boolean} enabled - 是否啟用此組件功能
     */
    enabled: { type: 'boolean', default: true }
  },

  // ------------------ Lifecycle Methods: 組件生命週期方法 ------------------

  /**
   * 組件初始化時執行的函式，只會執行一次。
   */
  init: function () {
    // ---- 狀態變數 ----
    this.isDragging = false;      // 是否正在拖曳 (滑鼠左鍵或單指觸控)
    this.isPinching = false;      // 是否正在雙指縮放
    this.previousDragPosition = { x: 0, y: 0 }; // 上一次拖曳的螢幕位置
    this.previousPinchDistance = 0; // 上一次雙指的距離

    // ---- 為了在移除監聽器時能正確引用，預先綁定 this ----
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    // ---- 取得場景的 canvas ----
    this.canvasEl = this.el.sceneEl.canvas;
  },

  /**
   * 組件啟動或更新時執行的函式。
   */
  play: function () {
    this.addEventListeners();
  },

  /**
   * 組件暫停或移除時執行的函式。
   */
  pause: function () {
    this.removeEventListeners();
  },

  /**
   * 當組件從實體上移除時執行的函式。
   */
  remove: function () {
    this.pause();
  },

  // ------------------ Event Listeners: 事件監聽管理 ------------------

  /**
   * 新增所有事件監聽器。
   */
  addEventListeners: function () {
    // 滑鼠事件
    this.canvasEl.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp); // 監聽全域以防滑鼠移出 canvas
    window.addEventListener('mousemove', this.onMouseMove);
    this.canvasEl.addEventListener('wheel', this.onMouseWheel); // 滑鼠滾輪

    // 觸控事件
    this.canvasEl.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove);
  },

  /**
   * 移除所有事件監聽器，避免記憶體洩漏。
   */
  removeEventListeners: function () {
    // 滑鼠事件
    this.canvasEl.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.canvasEl.removeEventListener('wheel', this.onMouseWheel);

    // 觸控事件
    this.canvasEl.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchmove', this.onTouchMove);
  },

  // ------------------ Event Handlers: 事件處理函式 ------------------

  // ---- 滑鼠事件處理 ----

  onMouseDown: function (event) {
    if (!this.data.enabled) return;
    // 只處理滑鼠左鍵 (button === 0)
    if (event.button === 0) {
      this.isDragging = true;
      this.previousDragPosition.x = event.clientX;
      this.previousDragPosition.y = event.clientY;
    }
  },

  onMouseUp: function () {
    if (!this.data.enabled) return;
    this.isDragging = false;
  },

  onMouseMove: function (event) {
    if (!this.data.enabled || !this.isDragging) return;

    const deltaX = event.clientX - this.previousDragPosition.x;
    const deltaY = event.clientY - this.previousDragPosition.y;

    this.rotateObject(deltaX, deltaY);

    this.previousDragPosition.x = event.clientX;
    this.previousDragPosition.y = event.clientY;
  },

  onMouseWheel: function (event) {
    if (!this.data.enabled) return;
    // event.deltaY > 0 表示向下滾動 (縮小), < 0 表示向上滾動 (放大)
    const scaleAmount = event.deltaY > 0 ? -1 : 1;
    this.scaleObject(scaleAmount);
    // 防止頁面滾動
    event.preventDefault();
  },

  // ---- 觸控事件處理 ----

  onTouchStart: function (event) {
    if (!this.data.enabled) return;
    // 單指觸控 -> 拖曳
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousDragPosition.x = event.touches[0].clientX;
      this.previousDragPosition.y = event.touches[0].clientY;
    }
    // 雙指觸控 -> 縮放
    else if (event.touches.length === 2) {
      this.isDragging = false; // 避免單指拖曳衝突
      this.isPinching = true;
      this.previousPinchDistance = this.getPinchDistance(event.touches);
    }
  },

  onTouchEnd: function (event) {
    if (!this.data.enabled) return;
    // 當手指放開時，重設所有狀態
    this.isDragging = false;
    this.isPinching = false;
  },

  onTouchMove: function (event) {
    if (!this.data.enabled) return;
    // 單指拖曳旋轉
    if (this.isDragging && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - this.previousDragPosition.x;
      const deltaY = event.touches[0].clientY - this.previousDragPosition.y;

      this.rotateObject(deltaX, deltaY);

      this.previousDragPosition.x = event.touches[0].clientX;
      this.previousDragPosition.y = event.touches[0].clientY;
    }
    // 雙指捏合縮放
    else if (this.isPinching && event.touches.length === 2) {
      const currentPinchDistance = this.getPinchDistance(event.touches);
      const deltaDistance = currentPinchDistance - this.previousPinchDistance;

      this.scaleObject(deltaDistance * 0.1); // 乘以一個係數讓縮放更平滑

      this.previousPinchDistance = currentPinchDistance;
    }
  },


  // ------------------ Core Logic: 核心功能函式 ------------------

  /**
   * 旋轉物件的核心函式
   * @param {number} deltaX - X 軸方向的移動量
   * @param {number} deltaY - Y 軸方向的移動量
   */
  rotateObject: function (deltaX, deltaY) {
    const el = this.el;
    const data = this.data;
    const object3D = el.object3D;

    // 計算旋轉量，乘以靈敏度
    const pitch = deltaY * data.rotationSpeed * (Math.PI / 180); // 繞 X 軸旋轉 (上下)
    const yaw = deltaX * data.rotationSpeed * (Math.PI / 180);   // 繞 Y 軸旋轉 (左右)

    if (data.rotationCoordinate === 'local') {
      // --- 自身座標旋轉 (Local Coordinate) ---
      // 這種方式會讓物件以自身的軸向進行旋轉，就像飛機的翻滾和偏航。
      // rotateX 是繞著物件自身的 X 軸旋轉。
      // rotateY 是繞著物件自身的 Y 軸旋轉。
      object3D.rotateX(pitch);
      object3D.rotateY(yaw);
    } else {
      // --- 世界座標旋轉 (World Coordinate) ---
      // 這種方式會讓物件繞著場景的固定軸向旋轉，想像一下地球繞著太陽公轉。
      // 我們使用四元數 (Quaternion) 來避免萬向鎖問題 (Gimbal Lock)。

      // 創建一個代表世界 Y 軸的向量
      const worldAxisY = new THREE.Vector3(0, 1, 0);
      // 創建一個代表世界 X 軸的向量
      const worldAxisX = new THREE.Vector3(1, 0, 0);

      // 讓物件繞著世界 Y 軸旋轉
      object3D.rotateOnWorldAxis(worldAxisY, yaw);
      // 讓物件繞著世界 X 軸旋轉
      object3D.rotateOnWorldAxis(worldAxisX, pitch);
    }
  },

  /**
   * 縮放物件的核心函式
   * @param {number} amount - 縮放的量
   */
  scaleObject: function (amount) {
    const el = this.el;
    const data = this.data;
    let scale = el.getAttribute('scale');

    const scaleFactor = 1 + amount * data.scaleSpeed;

    // 更新 scale 的各個分量
    scale.x *= scaleFactor;
    scale.y *= scaleFactor;
    scale.z *= scaleFactor;

    // 設置新的 scale
    el.setAttribute('scale', scale);
  },

  /**
   * 計算雙指觸控的距離
   * @param {TouchList} touches - 觸控點列表
   * @returns {number} 兩個觸控點之間的距離
   */
  getPinchDistance: function (touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
});
//#endregion

//#region 需要與mindar-image-target掛在同一個Entity上，透過他轉為全域事件
AFRAME.registerComponent('targetevent-global', {
  init: function () {
    this.el.addEventListener("targetFound", (event) => {
      window.dispatchEvent(new CustomEvent("targetfound-global-event", { detail: this.el.id }))
      console.log("targetFound");
    })

    this.el.addEventListener("targetLost", (event) => {
      window.dispatchEvent(new CustomEvent("targetlost-global-event", { detail: this.el.id }))
      console.log("targetLost");
    })

  }
});
//#endregion

//#region  重置旋轉(接收父物件的全域事件)
AFRAME.registerComponent('reset-transform',
  {
    schema:
    {
      rrotation: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
      rscale: { type: "vec3", default: { x: 1, y: 1, z: 1 } }
    },
    init: function () {
      window.addEventListener("targetfound-global-event", (event) => {
        this.el.setAttribute("rotation", this.data.rrotation);
        this.el.setAttribute("scale", this.data.rscale)
        console.log("偵測到了，重置旋轉");
      })
    },
  });
//#endregion

//#region  觸控觸發動畫的暫停(timescale)
AFRAME.registerComponent('active-ani', {
  schema:
  {
    IsActive: { type: 'boolean', default: false }, // 初始化完成後是否自動播放
    IsLoaded: { type: 'boolean', default: false }, // 是否載入完成
    sec: { type: 'number', default: 8 },
    src: { type: "asset" }
  },
  init: function () {

    //DOM取得
    const modelinfo = document.querySelector("#modelinfo");

    //監聽模型載入是否完成
    this.el.addEventListener("model-loaded", () => this.data.IsLoaded = true);

    this.el.setAttribute("animation-mixer", { clip: this.data.src, duration: this.data.sec, timeScale: 1 })  //把其他組件加入

    //圖片偵測事件
    window.addEventListener("targetlost-global-event", (event) => { this.el.setAttribute('active-ani', 'IsActive', false); })  //要更改data的值，都要用setAttribute

    //觸控事件
    // window.addEventListener("touchstart", this.change_active.bind(this))  //可以用bind綁定
    // window.addEventListener("click", (event) => { this.change_active(); }); //也可以用箭頭函式

    //DOM按鈕事件
    const Ani_button = document.getElementById("Ani_button")
    Ani_button.addEventListener("click", () => { this.change_active(); });
  },

  //aframe內建方法，當schema data改變時作用
  update: function (OldData) {

    if (OldData.IsActive != this.data.IsActive) {
      // this.el.setAttribute("animation-mixer", { timeScale: this.data.IsActive ? 1 : 0 })   //開始 暫停

      if (this.data.IsActive) {
        this.el.setAttribute("animation-mixer", { clip: this.data.src, duration: this.data.sec, timeScale: 1 })
      }
      else {
        this.el.setAttribute("animation-mixer", { clip: "idle", duration: this.data.sec, timeScale: 0 })
      }
    }
  },
  //控制開關
  change_active: function () {
    const mixer = this.el.components['animation-mixer']
    this.el.setAttribute('active-ani', 'IsActive', !this.data.IsActive);
  }
});
//#endregion

//#region 聲音控制(會與image tracking 衝突，使用不同層級避開影響)

AFRAME.registerComponent('active-sound', {
  schema:
  {
    autoplay: { type: 'boolean', default: false }, // 初始化完成後是否自動播放
    IsActive: { type: 'boolean', default: false },
    IsLoaded: { type: 'boolean', default: false }, // 是否載入完成
    src: { type: "asset" },
    targetid: { type: "string" } //id名稱
  },
  init: function () {

    this.evtid = null; //設定組件內的私有變數


    //增加Sound組件
    this.el.setAttribute("sound", `src:${this.data.src}; loop:true; volume:1; autoplay:${this.data.autoplay}`)

    //圖片偵測事件
    window.addEventListener("targetfound-global-event", (event) => { this.evtid = event.detail })
    window.addEventListener("targetlost-global-event", (event) => { this.el.setAttribute('active-sound', 'IsActive', false); this.evtid = null; })

    //觸控事件
    // window.addEventListener("touchstart", () => { this.data.IsActive = !this.data.IsActive; this.el.setAttribute('active-sound', "IsActive", this.data.IsActive) });
    // window.addEventListener("click", () => { this.data.IsActive = !this.data.IsActive; this.el.setAttribute('active-sound', "IsActive", this.data.IsActive) });

    //DOM按鈕事件
    const Ani_button = document.getElementById("Ani_button")
    Ani_button.addEventListener("click", () => { this.data.IsActive = !this.data.IsActive; this.el.setAttribute('active-sound', "IsActive", this.data.IsActive) });

    //測試區
    this.el.addEventListener("sound-loaded", () => this.data.IsLoaded = true);
  },

  //假如事件發送的id 與targetid 相同才能啟用
  update: function (oldDate) {
    if (oldDate != this.data && this.data.targetid === this.evtid) {
      if (this.data.IsActive) {
        this.el.components.sound.playSound();
      } else {
        this.el.components.sound.stopSound();
      }
    }
  }

});

//#endregion


//#region 獲取模型中的物件資訊(可以不需要-透過射線即可)
AFRAME.registerComponent('model-info', {
  schema: {

  },

  init: function () {
    this.el.addEventListener("model-loaded", (e) => {
      const model = e.detail.model;
      const tarobj = model.getObjectByName('hotspot006')
      tarobj.scale.set(20, 20, 20);

      console.log(tarobj)

    })
  },

  update: function () {
    // Do something when component's data is updated.
  },

  remove: function () {
    // Do something the component or its entity is detached.
  },

  tick: function (time, timeDelta) {
    // Do something on every scene tick or frame.
  }
});

//#endregion


//#region 發送射線
AFRAME.registerComponent('ray-interactive',
  {
    schema:
    {
      objclass: { type: "string", default: null }
    },

    init: function () {
      this.el.setAttribute("raycaster", `objects:${this.data.objclass}; far:9999; showLine:true`)
      this.el.setAttribute("cursor", "fuse: false; rayOrigin: mouse")
      this.el.setAttribute("line", "color: red; opacity: 0.8")
      // this.el.addEventListener('click', function (evt) { console.log("發送_射線事件=",evt.detail.intersection.object.name); });  //打到mesh
    },
  });
//#endregion

//#region 物件接收射線
AFRAME.registerComponent('react-to-ray', {

  schema:
  {
    meshname: { type: "string" },
    idname: { type: "string" }
  },

  init: function () {
    // this.el.addEventListener("raycaster-intersected",(e)=>{console.log("發射源頭=",e.detail.el);})   //這結果會是射線，detail顯示發射源頭
    // this.el.addEventListener('mouseenter', () => { this.onRayEnter(); });
    this.el.setAttribute("class", "recive-ray"); //直接設定class name
    this.el.addEventListener('click', (e) => {
      if (e.detail.intersection != null) {
        console.log("接收_射線事件=", e.detail.intersection.object.name)
        if (this.data.meshname === e.detail.intersection.object.name) {
          console.log("吻合mesh名稱，觸發涵式", this.data.meshname)
        }
      }


    });
  },

  doActive: function () {
    //TODO 顯示dom物件 
    console.log(`${this.el.name}被點擊了！`);
  }
});
//#endregion

//#region  簡易控制dom開關
AFRAME.registerComponent('domctrl', {
  schema: {
    idname: { type: "string" }
  },

  init: function () {
    this.isHide = false;
    this.dom = null;
    // window.addEventListener("click", () => { this.SwitchDOM() })
    this.el.addEventListener("click", () => { this.SwitchDOM() })

    dom = document.querySelector(this.data.idname);
    console.log("dom物件=" + dom)
    dom.style.display = "none";
  },

  SwitchDOM: function () {
    this.isHide = !this.isHide;
    if (this.isHide) {
      dom.style.display = "none";
    }
    else {
      dom.style.display = "block";
    }
    console.log("是否隱藏=" + this.isHide)
  }
});

//#endregion


//#region 點擊模型後，判斷射線是否擊中設定的網格名稱，符合就開啟dom

AFRAME.registerComponent('mesh-info', {
  multiple: true,
  schema: {
    meshname: { type: "string" },
    idname: { type: "string" }
  },

  init: function () {
    this.isHide = false;
    this.dom = document.querySelector(this.data.idname);
    const info_Panel = document.querySelector("#info_Panel");
    console.log("dom物件=" + this.dom);
    this.dom.style.display = "none";
    this.IsTrigger = false;

    this.el.setAttribute("class", "recive-ray"); //直接設定class name
    //滑鼠
    this.el.addEventListener('click', (e) => {
      if (e.detail.intersection != null) {
        // console.log("接收_射線事件=", e.detail.intersection.object.name)
        if (this.data.meshname === e.detail.intersection.object.name) {
          // console.log("吻合mesh名稱，觸發涵式", this.data.meshname);
          this.SwitchDOM();
        }
      }
    })

    //觸控
    this.el.addEventListener('touchstart', (e) => {
      if (e.detail.intersection != null) {
        // console.log("接收_射線事件=", e.detail.intersection.object.name)
        if (this.data.meshname === e.detail.intersection.object.name) {
          this.SwitchDOM();
        }
      }
    })
  },

  SwitchDOM: function () {
    this.isHide = false;
    if (this.isHide) {
      this.dom.style.display = "none";
      info_Panel.style.display = "none"
    }
    else {
      this.dom.style.display = "block";
      info_Panel.style.display = "block"
    }
    // console.log("是否隱藏=" + this.isHide)
  }
});


//#endregion

//#region  DOM開關物件
AFRAME.registerComponent('switch-model', {
  schema: {
    idname: { type: "string" },
    IsVisible: { type: 'boolean', default: false },
  },

  init: function () {
    dom= document.querySelector(this.data.idname);
    dom.addEventListener("click", () => { this.switchModel(); console.log("物件狀態") })
    this.el.setAttribute("visible", this.data.IsVisible)
  },

  switchModel() {
    this.data.IsVisible = !this.data.IsVisible
    this.el.setAttribute("visible", this.data.IsVisible)
    console.log("物件狀態" + this.data.IsVisible)
  }

});

//#endregion

