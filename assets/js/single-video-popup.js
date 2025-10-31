/*!
 * single-video-popup.js
 * 單獨視頻彈窗 - 用於 discover 等單個視頻播放
 * 與 video-popup.js 完全獨立，不使用 slick
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SingleVideoPopup = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  class SingleVideoPopup {
    constructor(options = {}) {
      this.options = Object.assign({}, {
        containerId: 'singleVideoPopupContainer',
        containerClass: 'singleVideoPopupContainer'
      }, options);
      
      this.videoData = null; // 單個視頻數據
      this.container = null;
      this.initialized = false;
      this._audioUnlocked = false;
    }

    /** 簡單 escape */
    _escape(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    /** 初始化容器 */
    init() {
      if (this.initialized && this.container && document.body && document.body.contains(this.container)) {
        return this.container;
      }

      const mount = this.options.appendTo || document.body;
      if (!mount) {
        document.addEventListener("DOMContentLoaded", () => this.init(), { once: true });
        return null;
      }

      // 查找或創建容器
      let container = this.options.containerId ? document.getElementById(this.options.containerId) : null;
      if (!container) {
        const $exist = jQuery("." + this.options.containerClass);
        container = $exist.length ? $exist.get(0) : null;
      }

      if (!container) {
        container = document.createElement("div");
        container.className = this.options.containerClass;
        if (this.options.containerId) container.id = this.options.containerId;
        container.setAttribute("data-single-video-popup", "");
        container.setAttribute("aria-hidden", "true");
        mount.appendChild(container);
      }

      this.container = container;
      this.initialized = true;

      // 建立 UI
      const $cont = jQuery(this.container);
      if (!$cont.find(".svp-stage").length) {
        this._buildUI($cont);
      }
      
      this._renderVideo();

      return container;
    }

    /** 建立 UI */
    _buildUI($container) {
      const $overlay = jQuery("<div/>", { "class": "svp-overlay", "data-action": "close" });
      const $stage = jQuery("<div/>", { "class": "svp-stage", role: "dialog", "aria-modal": "true" });
      const $close = jQuery("<button/>", { "class": "svp-close", "aria-label": "Close", "data-action": "close", text: "×" });
      
      const $videoWrapper = jQuery("<div/>", { "class": "svp-video-wrapper" });
      const $videoContainer = jQuery("<div/>", { "class": "svp-video-container" });
      const $video = jQuery("<video/>", { 
        "class": "svp-video", 
        preload: "metadata", 
        playsinline: "",
        muted: ""
      });
      const $volumeBtn = jQuery("<button/>", { 
        "class": "svp-volume-toggle", 
        "aria-label": "Toggle mute",
        html: '<i class="fa-solid fa-volume-xmark"></i>'
      });
      
      const $caption = jQuery("<div/>", { "class": "svp-caption" });
      const $title = jQuery("<div/>", { "class": "svp-title" });
      const $desc = jQuery("<div/>", { "class": "svp-description" });
      const $readMore = jQuery("<button/>", { "class": "svp-read-more", text: "查看更多" });
      const $progress = jQuery("<div/>", { "class": "svp-progress" });
      const $progressTrack = jQuery("<div/>", { "class": "svp-progress-track", "data-action": "seek" });
      const $progressFill = jQuery("<div/>", { "class": "svp-progress-fill" });
      const $progressDot = jQuery("<div/>", { "class": "svp-progress-dot", "data-action": "drag" });
      
      $progressTrack.append($progressFill, $progressDot);
      $progress.append($progressTrack);
      $caption.append($title, $desc, $readMore, $progress);
      
      $videoContainer.append($video, $volumeBtn);
      $videoWrapper.append($videoContainer, $caption);
      $stage.append($close, $videoWrapper);
      $container.empty().append($overlay, $stage);

      // 點擊遮罩或關閉按鈕關閉
      $container.off("click.svpClose").on("click.svpClose", "[data-action='close']", () => this.close());
    }

    /** 渲染視頻 */
    _renderVideo() {
      if (!this.container || !this.videoData) return;
      
      const $cont = jQuery(this.container);
      const $title = $cont.find(".svp-title");
      const $desc = $cont.find(".svp-description");
      const $readMore = $cont.find(".svp-read-more");
      const $video = $cont.find(".svp-video");
      
      // 設置標題
      $title.text(this.videoData.title || '');
      
      // 設置描述（可選）
      const descText = this.videoData.description || '';
      if ($desc.length) {
        if (descText) {
          $desc.text(descText).show().removeClass('expanded');
        } else {
          $desc.text('').hide();
        }
      }
      
      // 讀取描述高度，決定是否顯示「查看更多」
      if ($desc.length && $readMore.length) {
        // 先重置按鈕與描述收起狀態
        $desc.removeClass('expanded');
        $readMore.hide();
        
        // 計算是否超出三行（根據 line-height 與實際 scrollHeight 判斷）
        setTimeout(() => {
          if ($desc.is(':visible')) {
            const el = $desc[0];
            const cs = window.getComputedStyle(el);
            const lineHeight = parseFloat(cs.lineHeight) || 20;
            const maxHeight = lineHeight * 3; // 與 CSS 對齊
            if (el.scrollHeight > maxHeight + 1) {
              $readMore.text('查看更多').show();
            } else {
              $readMore.hide();
            }
          }
        }, 50);
        
        // 綁定切換事件（使用命名空間避免重複）
        $readMore.off('click.svpReadMore').on('click.svpReadMore', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const expanded = $desc.toggleClass('expanded').hasClass('expanded');
          $readMore.text(expanded ? '顯示較少' : '查看更多');
        });
      }
      
      // 設置視頻源
      if ($video.length) {
        const video = $video[0];
        const oldSrc = video.src;
        const newSrc = this.videoData.link || "";
        
        // 如果視頻源改變，重置綁定標記
        if (oldSrc !== newSrc && video.dataset.svpBound === "true") {
          // 移除舊的事件監聽器
          if (video._svpHandlers) {
            video.removeEventListener("timeupdate", video._svpHandlers.timeupdate);
            video.removeEventListener("ended", video._svpHandlers.ended);
            video.removeEventListener("click", video._svpHandlers.click);
            delete video._svpHandlers;
          }
          video.dataset.svpBound = "false";
        }
        
        $video.attr("src", newSrc);
        
        // 綁定事件
        this._bindVideoEvents(video);
      }
    }

    /** 綁定視頻事件 */
    _bindVideoEvents(video) {
      if (!video) return;
      
      // 如果已經綁定過，先移除舊的事件監聽器
      if (video.dataset.svpBound === "true") {
        return; // 已經綁定過，不再重複綁定
      }
      
      const $video = jQuery(video);
      const $container = jQuery(this.container);
      const $progressFill = $container.find(".svp-progress-fill");
      const $progressDot = $container.find(".svp-progress-dot");
      const $volumeBtn = $container.find(".svp-volume-toggle");
      
      // 創建事件處理函數
      const handleTimeUpdate = () => {
        if (video.duration) {
          const pct = (video.currentTime / video.duration) * 100;
          $progressFill.css("width", pct + "%");
          $progressDot.css("left", pct + "%");
        }
      };
      
      const handleEnded = () => {
        $progressFill.css("width", "100%");
        $progressDot.css("left", "100%");
      };
      
      const handleVideoClick = (e) => {
        e.stopPropagation();
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      };
      
      const handleVolumeClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        video.muted = !video.muted;
        const $icon = $volumeBtn.find("i");
        if (video.muted) {
          $icon.removeClass("fa-volume-high").addClass("fa-volume-xmark");
        } else {
          $icon.removeClass("fa-volume-xmark").addClass("fa-volume-high");
        }
      };
      
      // 綁定事件
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("click", handleVideoClick);
      
      // 音量按鈕事件（先移除舊的再綁定新的）
      $volumeBtn.off("click.svpVolume").on("click.svpVolume", handleVolumeClick);
      
      // 保存事件處理函數到 video 元素上以便後續移除
      video._svpHandlers = {
        timeupdate: handleTimeUpdate,
        ended: handleEnded,
        click: handleVideoClick
      };
      
      // 標記為已綁定
      video.dataset.svpBound = "true";
      
      // 進度條點擊（使用命名空間）
      const $progressTrack = $container.find(".svp-progress-track");
      $progressTrack.off("click.svpProgress").on("click.svpProgress", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = $progressTrack[0].getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = percent * video.duration;
        if (!isNaN(newTime) && video.duration) {
          video.currentTime = newTime;
        }
      });
      
      // 首次互動後開聲
      if (!this._audioUnlocked) {
        const unlockAudio = () => {
          try {
            video.muted = false;
            video.volume = 1;
            this._audioUnlocked = true;
            const $icon = $volumeBtn.find("i");
            $icon.removeClass("fa-volume-xmark").addClass("fa-volume-high");
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("touchstart", unlockAudio);
          } catch (_) {}
        };
        document.addEventListener("click", unlockAudio, { once: true });
        document.addEventListener("touchstart", unlockAudio, { once: true });
      }
    }

    /** 打開彈窗 */
    open(videoData) {
      if (!videoData) {
        console.error("SingleVideoPopup: videoData is required");
        return;
      }
      
      this.videoData = videoData;
      
      const run = () => {
        if (!this.container) {
          this.init();
        }
        
        const $container = jQuery(this.container);
        if (!$container.length) return null;

        // 重新渲染視頻（確保使用最新的數據）
        this._renderVideo();

        // 顯示彈窗
        $container.addClass("is-active").css("display", "block").attr("aria-hidden", "false");

        // 準備播放
        const video = $container.find(".svp-video")[0];
        if (video) {
          setTimeout(() => {
            video.play().catch(() => {});
          }, 100);
        }

        return this.container;
      };

      if (!this.initialized || !this.container) {
        this.init();
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", run, { once: true });
          return null;
        }
      }
      return run();
    }

    /** 關閉彈窗 */
    close() {
      const $container = this.container ? jQuery(this.container) : jQuery("." + this.options.containerClass);
      if (!$container.length) return null;

      // 暫停視頻
      const video = $container.find(".svp-video")[0];
      if (video) {
        try { video.pause(); } catch (_) {}
      }

      // 隱藏彈窗
      if ($container.hasClass("is-active")) {
        $container.removeClass("is-active").css("display", "none").attr("aria-hidden", "true");
      }

      return this.container;
    }

    /** 銷毀 */
    destroy() {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
      this.initialized = false;
    }
  }

  return SingleVideoPopup;
});

