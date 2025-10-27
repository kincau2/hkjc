/*!
 * video-popup.js v0.2.3 (jQuery edition)
 * - init(): 插入 <div class="videoPopContainer">，建立骨架並渲染 slides
 * - slick：單張置中；中心自動播 mp4，旁邊只顯示縮圖
 * - 進度條：僅顯示播放進度（不拖曳）
 * - 自動循環下一段：影片 ended -> slickNext()
 * - 修正：所有播放控制都作用在「當前顯示的實際 DOM slide」（處理 clone）
 * - 切換 slide 時，一律從 0 秒開始播放
 * - 新增：首次使用者互動（click/touch/keydown）後自動解除靜音，之後皆有聲
 */
(function (root, factory) {
  // 設定 --vh 以修正行動端 100vh 問題
  var vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
  window.addEventListener('resize', function () {
    var vh2 = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh2 + 'px');
  });

  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.VideoPopup = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DEFAULTS = {
    containerClass: "videoPopContainer",
    containerId: null,
    appendTo: null // lazy 決定，避免 <head> 早期載入時沒有 body
  };

  class VideoPopup {
    constructor(options = {}) {
      this.options = Object.assign({}, DEFAULTS, options);
      /** Public: 使用者在 init() 前賦值 */
      this.videoList = [];
      /** Internal */
      this.initialized = false;
      this.container = null;  // DOM element
      this.currentIndex = 0;  // 原始索引（0..N-1）
      this._audioUnlocked = false; // 首次互動解除靜音後設為 true
    }

    /** 簡單 escape（用於 title） */
    _escape(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    /** 取得 slick wrap（jQuery 物件） */
    _getWrap() {
      return this.container ? jQuery(this.container).find(".vp-slider") : jQuery();
    }

    /**
     * 初始化：插入/取得容器、建立 UI、渲染縮圖、發出 ready 事件
     * 回傳容器元素（若 DOM 未就緒而延後，回傳 null）
     */
    init() {
      const createOrFind = () => {
        if (this.initialized && this.container && document.body && document.body.contains(this.container)) {
          return this.container;
        }

        const mount = this.options.appendTo || document.body;
        if (!mount) {
          document.addEventListener("DOMContentLoaded", () => createOrFind(), { once: true });
          return null;
        }

        // 1) 先找現有容器
        let container = this.options.containerId ? document.getElementById(this.options.containerId) : null;
        if (!container) {
          const $exist = jQuery("." + this.options.containerClass);
          container = $exist.length ? $exist.get(0) : null;
        }

        // 2) 沒有就建立
        if (!container) {
          container = document.createElement("div");
          container.className = this.options.containerClass;
          if (this.options.containerId) container.id = this.options.containerId;
          container.setAttribute("data-video-popup", "");
          container.setAttribute("aria-hidden", "true");
          mount.appendChild(container);
        }

        this.container = container;
        this.initialized = true;

        // 建立 UI + 渲染 slides
        const $cont = jQuery(this.container);
        if (!$cont.find(".vp-stage").length) this._buildUI($cont);
        this._renderSlides();

        // 發出 ready 事件
        try {
          const evt = new CustomEvent("videoPopup:ready", { detail: { instance: this } });
          window.dispatchEvent(evt);
        } catch (_) {}

        return container;
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => createOrFind(), { once: true });
        return null;
      }
      return createOrFind();
    }

    /** 等容器 ready 後才執行 cb；已就緒則立即執行 */
    _onReady(cb) {
      if (this.initialized && this.container) {
        cb();
        return;
      }
      const handler = () => {
        window.removeEventListener("videoPopup:ready", handler);
        cb();
      };
      window.addEventListener("videoPopup:ready", handler, { once: true });
    }

    /** 建 UI（jQuery）：遮罩 / 關閉鈕 / slider 容器 */
    _buildUI(container) {
      const $c = container instanceof jQuery ? container : jQuery(container);

      const $overlay = jQuery("<div/>", { "class": "vp-overlay", "data-action": "close" });
      const $stage   = jQuery("<div/>", { "class": "vp-stage", role: "dialog", "aria-modal": "true" });
      const $close   = jQuery("<button/>", { "class": "vp-close", "aria-label": "Close", "data-action": "close", text: "×" });
      const $slider  = jQuery("<div/>", { "class": "vp-slider" });

      $stage.append($close, $slider);
      $c.empty().append($overlay, $stage);

      // 點遮罩或關閉按鈕 -> 關閉
      $c.off("click.vpClose").on("click.vpClose", "[data-action='close']", () => this.close());
    }

    /** 渲染 slides；若有 slick，初始化/重建 slick（中心自動播影片） */
    _renderSlides() {
      if (!this.container) return;
      const $wrap = this._getWrap();
      if (!$wrap.length) return;

      const html = (this.videoList || []).map((v, i) => `
        <div class="vp-slide" data-index="${i}">
          <div class="vp-media">
            <img class="vp-thumb" src="${this._escape(v.thumbnail)}" alt="${v.title || ('thumb '+i)}">
            <video class="vp-video" preload="metadata" playsinline muted></video>
            <button class="vp-volume-toggle" aria-label="Toggle mute">
              <i class="fa-solid fa-volume-xmark"></i>
            </button>
          </div>
          <div class="vp-caption">
            <div class="vp-title">${v.title || ''}</div>
            <div class="vp-progress">
              <div class="vp-progress-track">
                <div class="vp-progress-fill"></div>
                <div class="vp-progress-dot"></div>
              </div>
            </div>
          </div>
        </div>
      `).join("");

      $wrap.html(html);

      if (jQuery.fn && jQuery.fn.slick) {
        if ($wrap.hasClass("slick-initialized")) $wrap.slick("unslick");

        $wrap.slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: "0px",
          infinite: true,
          dots: false,
          arrows: false,
          focusOnSelect: true,
          variableWidth: false,
          adaptiveHeight: false
        });

        // 工具：由 internal index 取當前 DOM slide / 原始索引
        const toEl   = (slick, internalIndex) => jQuery(slick.$slides[internalIndex]); // 真正顯示中的 DOM slide（可能是 clone）
        const toReal = (slick, internalIndex) => Number(toEl(slick, internalIndex).data("index")); // 0..N-1

        // 切換前：暫停當前顯示中的 DOM slide，並立即更新 side classes
        $wrap.on("beforeChange.vp", (e, slick, curr, next) => {
          const $currEl = toEl(slick, curr);
          this._pauseSlideEl($currEl);
          
          // 立即更新下一個 slide 的 is-active 和 side classes
          const $nextEl = toEl(slick, next);
          this._getWrap().find(".vp-slide").removeClass("is-active");
          $nextEl.addClass("is-active");
          this._updateSideClasses();
        });

        // 切換後：啟動當前顯示中的 DOM slide，並從 0 秒開始
        $wrap.on("afterChange.vp", (e, slick, curr) => {
          const $currEl = toEl(slick, curr);
          const realIdx = toReal(slick, curr);
          this._activateSlideEl($currEl, realIdx, /*resetToZero*/ true);
        });

        // 首次啟動：針對「當前顯示中的 DOM slide」
        const slickApi = $wrap.slick("getSlick");
        const $initialEl = jQuery(slickApi.$slides[slickApi.currentSlide]);
        const initialReal = Number($initialEl.data("index"));
        this._activateSlideEl($initialEl, initialReal, /*resetToZero*/ false);
      }
    }

    /** 更新左右側 slide 的 class */
    _updateSideClasses() {
      const $wrap = this._getWrap();
      if (!$wrap.length) return;

      // 找到所有在 slick-track 下的 vp-slide
      const $track = $wrap.find(".slick-track");
      const $slides = $track.find(".vp-slide");
      const $activeSlide = $slides.filter(".is-active").first();

      if (!$activeSlide.length) return;

      // 移除所有 left-slide 和 right-slide class
      $slides.removeClass("left-slide right-slide");

      // 找到 active slide 在所有 slides 中的索引
      const activeIndex = $slides.index($activeSlide);

      // 為左側的 slides 加上 left-slide class
      $slides.each(function(index) {
        if (index < activeIndex) {
          jQuery(this).addClass("left-slide");
        } else if (index > activeIndex) {
          jQuery(this).addClass("right-slide");
        }
      });
    }

    /** 以「DOM 元素」為主體啟動（修正 clone 問題）；可選是否歸零開始 */
    _activateSlideEl($slideEl, realIndex, resetToZero) {
      if (!$slideEl || !$slideEl.length) return;
      const $wrap = this._getWrap();

      // 樣式狀態：只把當前 element 標記為 is-active；其他移除
      $wrap.find(".vp-slide").removeClass("is-active");
      $slideEl.addClass("is-active");

      // 更新左右側 class
      this._updateSideClasses();

      // 取得該 element 裡的 video
      const video = $slideEl.find(".vp-video")[0];
      const meta  = this.videoList[realIndex] || {};
      if (!video) return;

      // 設定 src（只在未設定時）
      if (!video.src) {
        try { video.src = meta.link || ""; } catch (_) {}
      }

      // 綁定進度 & 結束自動下一段（只綁一次）
      if (!$slideEl.data("vpBound")) {
        video.addEventListener("timeupdate", () => this._updateProgress($slideEl, video));
        video.addEventListener("ended", () => {
          this._updateProgress($slideEl, video, true);
          this._autoNext(); // 自動循環下一段
        });
        
        // 點擊影片切換播放/暫停
        video.addEventListener("click", (e) => {
          e.stopPropagation(); // 防止冒泡觸發其他點擊事件
          if (video.paused) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
        
        // 點擊音量按鈕切換靜音/取消靜音
        const $volumeBtn = $slideEl.find(".vp-volume-toggle");
        $volumeBtn.on("click", (e) => {
          e.stopPropagation(); // 防止冒泡觸發其他點擊事件
          video.muted = !video.muted;
          this._updateVolumeIcon($slideEl, video.muted);
        });
        
        $slideEl.data("vpBound", true);
      }

      // 切 slide 一律從 0 秒開始（你要求）
      if (resetToZero) {
        try { video.currentTime = 0; } catch (_) {}
        // 也同步把 UI 進度歸零
        $slideEl.find(".vp-progress-fill").css("width", "0%");
        $slideEl.find(".vp-progress-dot").css("left", "0%");
      }

      // 確保已設置「首次互動後開聲」的監聽
      this._enableAudioOnFirstInteraction();

      // 播放
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => { /* 需要互動才可播放時保持靜默 */ });
      }

      // 若已解鎖音訊，立即取消靜音
      if (this._audioUnlocked) {
        try { video.muted = false; video.volume = 1; } catch (_) {}
      }
      
      // 更新音量圖示
      this._updateVolumeIcon($slideEl, video.muted);
    }

    /** 以「原始索引」啟動（for 舊接口相容，會轉成以元素為主） */
    _activateSlide(realIndex) {
      const $wrap = this._getWrap();
      const slickApi = $wrap.slick("getSlick");
      const $el = jQuery(slickApi.$slides[slickApi.currentSlide]); // 取當前實際 DOM slide
      this._activateSlideEl($el, realIndex, /*resetToZero*/ false);
    }

    /** 暫停：以 DOM 元素為單位 */
    _pauseSlideEl($slideEl) {
      if (!$slideEl || !$slideEl.length) return;
      const video = $slideEl.find(".vp-video")[0];
      if (video) {
        try { video.pause(); } catch (_) {}
      }
      // 重置進度 UI（不保留）
      $slideEl.find(".vp-progress-fill").css("width", "0%");
      $slideEl.find(".vp-progress-dot").css("left", "0%");
    }

    /** 暫停：以原始索引為單位（相容） */
    _pauseSlide(realIndex) {
      const $wrap = this._getWrap();
      const slickApi = $wrap.slick("getSlick");
      const $el = jQuery(slickApi.$slides[slickApi.currentSlide]);
      this._pauseSlideEl($el);
    }

    /** 更新進度條（由 timeupdate 觸發） */
    _updateProgress($slideEl, video, isEnded = false) {
      const dur = video.duration || 0;
      const cur = isEnded ? dur : (video.currentTime || 0);
      const pct = dur ? Math.max(0, Math.min(100, (cur / dur) * 100)) : 0;

      $slideEl.find(".vp-progress-fill").css("width", pct + "%");
      $slideEl.find(".vp-progress-dot").css("left", pct + "%");
    }

    /** 自動前往下一段（slick 環狀） */
    _autoNext() {
      const $wrap = this._getWrap();
      if ($wrap.length && $wrap.hasClass("slick-initialized")) {
        $wrap.slick("slickNext");
      }
    }

    /** 首次使用者互動後，解除靜音（之後皆有聲） */
    _enableAudioOnFirstInteraction() {
      if (this._audioUnlocked) return;

      // Immediately unlock audio since opening the popup is already a user interaction
      const $wrap = this._getWrap();
      if ($wrap.length && $wrap.hasClass("slick-initialized")) {
        const api = $wrap.slick("getSlick");
        const $el = jQuery(api.$slides[api.currentSlide]);
        const vid = $el.find(".vp-video")[0];
        if (vid) {
          try { vid.muted = false; vid.volume = 1; } catch (_){}
          // 更新音量圖示以反映取消靜音狀態
          this._updateVolumeIcon($el, false);
        }
      }
      this._audioUnlocked = true;
    }

    /** 更新音量圖示 */
    _updateVolumeIcon($slideEl, isMuted) {
      if (!$slideEl || !$slideEl.length) return;
      const $icon = $slideEl.find(".vp-volume-toggle i");
      if ($icon.length) {
        if (isMuted) {
          $icon.removeClass("fa-volume-high").addClass("fa-volume-xmark");
        } else {
          $icon.removeClass("fa-volume-xmark").addClass("fa-volume-high");
        }
      }
    }

    /**
     * 開啟彈窗（只顯示容器）
     * @param {number} index 原始索引 0..N-1（open 後會 goTo 該張）
     * 切到指定 slide 後，會在 afterChange 裡從 0 秒開始播放
     */
    open(index = 0) {
      const run = () => {
        const $container = this.container ? jQuery(this.container) : jQuery("." + this.options.containerClass);
        if (!$container.length) return null;

        if (!$container.hasClass("is-active")) {
          $container.addClass("is-active").css("display", "block").attr("aria-hidden", "false");
        }
        this.currentIndex = index;

        const $wrap = this._getWrap();
        if ($wrap.length && $wrap.hasClass("slick-initialized")) {
          $wrap.slick('slickGoTo', index, true); // afterChange 會自動 _activateSlideEl 並歸零開始
        }

        // 準備好互動後開聲
        this._enableAudioOnFirstInteraction();

        try {
          window.dispatchEvent(new CustomEvent("videoPopup:open", { detail: { instance: this, index } }));
        } catch (_) {}

        return $container.get(0);
      };

      if (!this.initialized || !this.container) {
        this.init();
        this._onReady(run);
        return null;
      }
      return run();
    }

    /** 關閉彈窗（隱藏容器） */
    close() {
      const $container = this.container ? jQuery(this.container) : jQuery("." + this.options.containerClass);
      if (!$container.length) return null;

      // 暫停當前顯示中的 slide
      const $wrap = this._getWrap();
      if ($wrap.length && $wrap.hasClass("slick-initialized")) {
        const slickApi = $wrap.slick("getSlick");
        const $el = jQuery(slickApi.$slides[slickApi.currentSlide]);
        this._pauseSlideEl($el);
      }

      if ($container.hasClass("is-active")) {
        $container.removeClass("is-active").css("display", "none").attr("aria-hidden", "true");
      }

      try {
        window.dispatchEvent(new CustomEvent("videoPopup:close", { detail: { instance: this } }));
      } catch (_) {}

      return $container.get(0);
    }

    /** 移除整個容器 */
    destroy() {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
      this.initialized = false;
    }
  }

  return VideoPopup;
});
