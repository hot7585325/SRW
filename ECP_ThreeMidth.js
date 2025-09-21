
// 最上方加上這行
import * as THREE from 'three';
import { AnimationMixer } from 'three';

export class ECP {
    constructor() {
        //動畫用
        this.clock = new THREE.Clock();
        this.mixers = [];   //陣列存取動畫
        this.actions = [];
        this.placedMesh = new THREE.Group();  //空物件 手勢控制用
        this.placedMesh.name = "placedMesh"; // ✅ 命名
        this.uvScrollRegistry = []; // 儲存所有要滾動的貼圖

    }

    //DOM註冊
    mapDomByIds(idArray) {
        this.domMap = {};
        idArray.forEach(id => {
            this.domMap[id] = document.getElementById(id);
        });
        return this.domMap;
    }

    //DOM顯示
    GSAP_DOM_Active(id, show) {
        const el = document.getElementById(id);
        if (!el) return;
        if (show) {
            // 顯示並彈跳出現
            el.style.display = "block";
            gsap.fromTo(el,
                { scale: 0, y: 50, opacity: 0 },
                {
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: "bounce.out"
                }
            );
        } else {
            // 縮小並消失
            gsap.to(el, {
                scale: 0,
                y: 50,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                    el.style.display = "none";
                }
            });
        }
    }

    //Model顯示
    GSAP_Model_Active(MeshName, show, scene) {
        const model = scene.getObjectByName(MeshName);
        if (!model) return;
        if (show) {
            model.visible = true;
            gsap.fromTo(model.scale,
                { x: 0, y: 0, z: 0 },
                {
                    x: 1, y: 1, z: 1,
                    duration: 0.6,
                    ease: "bounce.out"
                }
            );
        } else {
            gsap.to(model.scale, {
                x: 0, y: 0, z: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                    model.visible = false;
                }
            });
        }
    }
    //射線模型觸發DOM
    raycastShowDOM(MeshName, domId, renderer, camera, scene) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        renderer.domElement.addEventListener('click', event => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const targetMesh = scene.getObjectByName(MeshName);
            if (!targetMesh) return;

            const intersects = raycaster.intersectObject(targetMesh, true);
            if (intersects.length > 0) {
                const el = document.getElementById(domId);
                if (el) {
                    this.GSAP_DOM_Active(domId, true);
                    console.log("打開dom");
                }
            }
        });
    }

    //DOM位移動畫
    gsapToggleById(domId, show, options = {}) {
        const el = document.getElementById(domId);
        if (!el) return;

        // 預設值（可被 options 覆蓋）
        const {
            x = 0,
            y = 0,
            scale = 1,
            opacity = 1,
            duration = 0.5,
            ease = "power2.out",
            delay = 0,
            onComplete = null
        } = options;

        if (show) {
            el.style.display = "block";
            gsap.to(el, {
                x,
                y,
                scale,
                opacity,
                duration,
                ease,
                delay,
                onComplete
            });
        } else {
            gsap.to(el, {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 0,
                duration,
                ease: "power2.in",
                delay,
                onComplete: () => {
                    el.style.display = "none";
                    if (onComplete) onComplete();
                }
            });
        }
    }


    //獲取Model
    GetModelMesh(MeshName) {
        const model = scene.getObjectByName(MeshName);
        return model;
    }

    //設定model相關參數(不需要使用 scene.add(_model)，因為作為容器的placedMesh已經實作了)
    Set_Model_Attribute(gltf, AniIndex = 0) {

        const _model = gltf.scene;
        //加到以實作scene.add，的容器中
        this.placedMesh.add(_model);

        //轉換
        _model.position.set(0, 0, 0); // 相對於 placedMesh 的位置
        _model.quaternion.identity(); // 清除旋轉（可選）
        _model.scale.setScalar(0.5);  // 設定縮放


        //動畫
        this._mixer = new AnimationMixer(_model);
        if (gltf.animations && gltf.animations.length > 0) {
            this.clip = gltf.animations[AniIndex];
            this._action = this._mixer.clipAction(this.clip);
            this.mixers.push(this._mixer);
            this.actions.push(this._action);
            return this._action;
        } else {
            console.warn("⚠️ 此模型沒有動畫剪輯 gltf.animations 為空");
            return null;
        }

    }

    //註冊uv 動畫
    Register_UV_Ani(modelName, textureChannel, xSpeed, ySpeed, scene) {
        const model = this.placedMesh.getObjectByName(modelName) || scene.getObjectByName(modelName);
        if (!model) {
            console.warn(`❌ 找不到模型：${modelName}`);
            return;
        }

        model.traverse((child) => {
            if (child.isMesh && child.material && child.material[textureChannel]) {
                const texture = child.material[textureChannel];

                if (this.uvScrollRegistry.some(entry => entry.texture.uuid === texture.uuid)) {
                    console.warn(`貼圖已註冊過：${child.name}`);
                    return;
                }

                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                // texture.repeat.set(4, 4);
                texture.offset.set(0, 0);
                texture.needsUpdate = true;
                console.log("貼圖名稱=" + texture.name)

                this.uvScrollRegistry.push({
                    modelName: child.name,
                    texture,
                    xSpeed,
                    ySpeed,
                    enabled: true
                });

            }
        });
    }


    //更新uv 動畫
    update_UVAni() {
        this.uvScrollRegistry.forEach(({ texture, xSpeed, ySpeed, enabled }) => {
            if (!enabled) return;
            texture.offset.x = (texture.offset.x + xSpeed) % 1;
            texture.offset.y = (texture.offset.y + ySpeed) % 1;
        });
    }


    Set_UV_Ani_Enabled(modelName, enabled) {
        const entry = this.uvScrollRegistry.find(e => e.modelName === modelName);
        if (!entry) {
            console.warn(`❌ 找不到已註冊的模型：${modelName}`);
            return;
        }
        entry.enabled = enabled;
        console.log(`✅ UV動畫 ${enabled ? "啟用" : "停用"}：${modelName}`);
    }

}

export default ECP;