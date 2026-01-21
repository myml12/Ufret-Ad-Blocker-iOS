// U-FRET Ad Blocker - Content Script
// eliminate.mdに記載されているDOM要素を監視して削除

(function () {
  'use strict';

  // 広告スクリプトのエラーを完全にブロック（最優先）
  (function () {
    const originalError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      // 広告関連のエラーを完全にブロック
      if (message && typeof message === 'string') {
        // メッセージに広告関連のキーワードが含まれている場合
        if (
          message.includes('rtct_adp_lib') ||
          message.includes('gpb_') ||
          message.includes('Element needs to be a valid HTML Element') ||
          message.includes('registerClickTracking') ||
          message.includes('SSPPassback') ||
          message.includes('loadSyncPixel') ||
          message.includes('bidr.io') ||
          message.includes('Uncaught Error') && (
            message.includes('Element') ||
            message.includes('HTML')
          )
        ) {
          return true; // エラーを完全に無視
        }
      }

      // ソースに広告関連のURLが含まれている場合
      if (source && typeof source === 'string') {
        if (
          source.includes('rtct_adp_lib') ||
          source.includes('gpb_') ||
          source.includes('geniee') ||
          source.includes('bidr.io') ||
          source.includes('richaudience') ||
          source.includes('googleads') ||
          source.includes('doubleclick')
        ) {
          return true; // エラーを完全に無視
        }
      }
      if (originalError) {
        return originalError.apply(this, arguments);
      }
      return false;
    };
  })();

  // 広告関連のネットワークリクエストをブロック
  (function () {
    // fetchをオーバーライド
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
      if (typeof url === 'string') {
        // 広告関連のURLをブロック
        if (
          url.includes('bidr.io') ||
          url.includes('richaudience') ||
          url.includes('rtct_adp_lib') ||
          url.includes('gpb_') ||
          url.includes('googleads') ||
          url.includes('doubleclick') ||
          url.includes('googlesyndication') ||
          url.includes('geniee') ||
          url.includes('yads')
        ) {
          return Promise.reject(new Error('Blocked by U-FRET Ad Blocker'));
        }
      }
      return originalFetch.apply(this, arguments);
    };

    // XMLHttpRequestをオーバーライド
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
      if (typeof url === 'string') {
        // 広告関連のURLをブロック
        if (
          url.includes('bidr.io') ||
          url.includes('richaudience') ||
          url.includes('rtct_adp_lib') ||
          url.includes('gpb_') ||
          url.includes('googleads') ||
          url.includes('doubleclick') ||
          url.includes('googlesyndication') ||
          url.includes('geniee') ||
          url.includes('yads')
        ) {
          this._blocked = true;
          return;
        }
      }
      return originalXHROpen.apply(this, arguments);
    };

    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
      if (this._blocked) {
        return;
      }
      return originalXHRSend.apply(this, arguments);
    };

    // Imageのsrcを監視して広告関連の画像をブロック
    const originalImage = window.Image;
    window.Image = function () {
      const img = new originalImage();
      const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
      Object.defineProperty(img, 'src', {
        set: function (value) {
          if (typeof value === 'string' && (
            value.includes('bidr.io') ||
            value.includes('richaudience') ||
            value.includes('googleads') ||
            value.includes('doubleclick') ||
            value.includes('googlesyndication')
          )) {
            return; // 広告関連の画像をブロック
          }
          originalSrcSetter.call(this, value);
        },
        get: function () {
          return this._src || '';
        }
      });
      return img;
    };

    // loadSyncPixelなどの広告関連関数を無効化
    if (window.loadSyncPixel) {
      window.loadSyncPixel = function () {
        return; // 無効化
      };
    }

    // 将来的に追加される可能性のある関数も無効化
    Object.defineProperty(window, 'loadSyncPixel', {
      value: function () { return; },
      writable: false,
      configurable: false
    });
  })();

  // 広告スクリプトの関数を無効化（rtct_adp_libなど）
  (function () {
    // registerClickTracking関数を無効化
    const adFunctions = [
      'registerClickTracking',
      'SSPPassback',
      'SSPPassback2'
    ];

    adFunctions.forEach(funcName => {
      // 既存の関数を無効化
      if (window[funcName]) {
        try {
          window[funcName] = function () { return; };
        } catch (e) {
          // 無視
        }
      }

      // 将来的に追加される可能性のある関数も無効化
      try {
        Object.defineProperty(window, funcName, {
          value: function () { return; },
          writable: false,
          configurable: false
        });
      } catch (e) {
        // 既に定義されている場合は無視
      }
    });

    // rtct_adp_libオブジェクトを無効化
    if (window.rtct_adp_lib) {
      try {
        // オブジェクトのメソッドを無効化
        Object.keys(window.rtct_adp_lib).forEach(key => {
          if (typeof window.rtct_adp_lib[key] === 'function') {
            try {
              window.rtct_adp_lib[key] = function () { return; };
            } catch (e) {
              // 無視
            }
          }
        });
        window.rtct_adp_lib = {};
      } catch (e) {
        // 無視
      }
    }

    // rtct_adp_libオブジェクトが追加される前に無効化
    try {
      Object.defineProperty(window, 'rtct_adp_lib', {
        value: {},
        writable: false,
        configurable: false
      });
    } catch (e) {
      // 既に定義されている場合は無視
    }

    // グローバルスコープの広告関連オブジェクトを監視
    const adObjectNames = ['rtct_adp_lib', 'SSPPassback', 'SSPPassback2'];
    adObjectNames.forEach(objName => {
      if (window[objName] && typeof window[objName] === 'object') {
        try {
          // オブジェクトのメソッドを無効化
          Object.keys(window[objName]).forEach(key => {
            if (typeof window[objName][key] === 'function') {
              try {
                window[objName][key] = function () { return; };
              } catch (e) {
                // 無視
              }
            }
          });
        } catch (e) {
          // 無視
        }
      }
    });
  })();

  // スクロール位置の保護（最優先で設定）
  (function () {
    let lastScrollTop = 0;
    let scrollProtectionActive = false;

    // scrollTo/scrollをオーバーライド
    const originalScrollTo = window.scrollTo;
    const originalScroll = window.scroll;

    window.scrollTo = function (x, y) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      lastScrollTop = currentScroll;

      // スクロール位置が50px以上の場合、0へのスクロールをブロック
      if (currentScroll > 50) {
        if (y === 0 || (typeof x === 'object' && x && x.top === 0 && x.left === 0)) {
          return; // scrollTop: 0をブロック
        }
      }
      return originalScrollTo.apply(this, arguments);
    };

    window.scroll = function (x, y) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      lastScrollTop = currentScroll;

      // スクロール位置が50px以上の場合、0へのスクロールをブロック
      if (currentScroll > 50) {
        if (y === 0 || (typeof x === 'object' && x && x.top === 0 && x.left === 0)) {
          return; // scrollTop: 0をブロック
        }
      }
      return originalScroll.apply(this, arguments);
    };

    // scrollIntoViewも監視
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (currentPos > 50) {
        // スクロール位置が50px以上の場合、トップへのスクロールをブロック
        if (!options || (options.block === 'start' && currentPos > 50)) {
          return;
        }
      }
      return originalScrollIntoView.apply(this, arguments);
    };

    // スクロール位置の自動復元（強化版）
    const protectScrollPosition = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const bodyScrollTop = document.body ? document.body.scrollTop || 0 : 0;

      // 突然0に戻された場合、直前の位置を復元
      if (lastScrollTop > 50 && currentScrollTop === 0 && bodyScrollTop === 0 && !scrollProtectionActive) {
        scrollProtectionActive = true;
        setTimeout(() => {
          if (originalScrollTo && lastScrollTop > 0) {
            originalScrollTo.call(window, 0, lastScrollTop);
          }
          scrollProtectionActive = false;
        }, 10);
      } else if (currentScrollTop > 0) {
        lastScrollTop = currentScrollTop;
      }

      // bodyとhtmlのscrollTopも監視
      if (document.body && document.body.scrollTop > 0) {
        lastScrollTop = Math.max(lastScrollTop, document.body.scrollTop);
      }
      if (document.documentElement && document.documentElement.scrollTop > 0) {
        lastScrollTop = Math.max(lastScrollTop, document.documentElement.scrollTop);
      }
    };

    // より頻繁に監視（30ms間隔に短縮）
    setInterval(protectScrollPosition, 30);

    // scrollイベントでも監視
    let scrollTimeout;
    let userInitiatedScroll = false;

    // ユーザーによるスクロールを検出
    ['wheel', 'touchmove', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        userInitiatedScroll = true;
        setTimeout(() => {
          userInitiatedScroll = false;
        }, 1000);
      }, { passive: true });
    });

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        protectScrollPosition();
        // ユーザーによるスクロールでない場合、位置を保護
        if (!userInitiatedScroll) {
          protectScrollPosition();
        }
      }, 10);
    }, { passive: true });

    // requestAnimationFrameでも監視
    let rafId;
    const rafProtect = () => {
      protectScrollPosition();
      rafId = requestAnimationFrame(rafProtect);
    };
    rafId = requestAnimationFrame(rafProtect);
  })();

  // 削除対象のセレクタパターン
  const SELECTORS = {
    // Google広告関連
    googleAdsIframe: [
      '[id^="google_ads_iframe_"]',
      '[id*="google_ads_iframe_"]',
      '[id*="__container__"]',
      'iframe[title*="広告"]',
      'iframe[aria-label*="広告"]'
    ],

    // Geniee広告関連
    genieeAds: [
      '#geniee_overlay_outer',
      '#geniee_overlay_inner',
      '#geniee_overlay_close',
      '[id^="geniee_"]',
      '#gn_interstitial_outer_area', // Genieeインタースティシャル広告（外側）
      '.gn_interstitial_outer_area', // Genieeインタースティシャル広告クラス
      '#gn_interstitial_inner_area', // Genieeインタースティシャル広告（内側）
      '.gn_interstitial_inner_area', // Genieeインタースティシャル広告クラス
      '#gn_interstitial_close', // Genieeインタースティシャル広告の閉じるボタン
      '.gn_interstitial_close', // Genieeインタースティシャル広告の閉じるボタンクラス
      '#gn_interstitial_close_clickable_area', // Genieeインタースティシャル広告のクリック可能エリア
      '#gn_interstitial_close_contents', // Genieeインタースティシャル広告の閉じるボタンコンテンツ
      '[id^="gnpbad_"]', // Geniee広告のiframe
      '[data-cptid]', // Geniee広告のラッパー
      '[data-gninstavoid]' // Geniee広告のインスタンス回避属性
    ],

    // YADS広告関連
    yadsAds: [
      '[id^="yads"]',
      '[class*="yads_ad"]',
      '[id^="gn_delivery_"]',
      '[id*="gn_delivery_"]'
    ],

    // その他の広告要素
    otherAds: [
      '#move-page-top',
      'a[href="#musical-score-header"]', // ページトップへのリンク（広告関連）
      '.ad-content-inter',
      '.fc-dialog-overlay', // ダイアログオーバーレイ（広告関連）
      '.fc-monetization-dialog', // 広告視聴要求ダイアログ
      '.fc-dialog', // ダイアログクラス
      '.fc-dialog-content', // ダイアログコンテンツ
      '.fc-rewarded-ad-button', // 広告ボタン
      '[class*="fc-"]', // fc-で始まるクラス（広告関連ダイアログ）
      '#full-screen-ad', // フルスクリーン広告
      '.full-screen-ad', // フルスクリーン広告クラス
      '#ufret-ad-close', // 広告の閉じるボタン
      '.ufret-ad-close', // 広告の閉じるボタンクラス
      '[id^="155"]', // 数字のみのID（広告関連）
      '[id^="158"]', // Geniee広告の数字ID（1582336, 1582337など）
      '[id^="canv_"]', // Canvas広告
      '#carouselExampleIndicators', // カルーセル広告要素
      '#carouselIndicators', // カルーセル広告要素（新バージョン）
      '.carousel-item a[href*="kooyguitars.com"]',
      '[id*="google_ads"]',
      '[id*="google-rewarded"]',
      '[class*="videoAdUi"]',
      '[class*="ima-sdk"]',
      '[id*="ima_"]',
      'fencedframe[id="ps_caff"]', // FencedFrame広告
      'fencedframe#ps_caff' // FencedFrame広告（別記法）
    ],

    // 広告関連スクリプト
    adScripts: [
      'script[src*="yads"]',
      'script[src*="googleads"]',
      'script[src*="doubleclick"]',
      'script[src*="googlesyndication"]',
      'script[src*="geniee"]',
      'script[src*="yimg.jp"]',
      'script[src*="sodar"]' // Google Sodar広告スクリプト
    ],

    // 非表示の広告iframe
    hiddenAdIframes: [
      'iframe[src*="sodar"]', // Google Sodar広告iframe
      'iframe[src*="tpc.googlesyndication.com/sodar"]', // 具体的なSodar URL
      'iframe[width="0"][height="0"]', // 非表示のiframe
      'iframe[style*="display: none"]' // display:noneのiframe
    ]
  };

  // 削除対象のIDパターン（正規表現）
  const ID_PATTERNS = [
    /^google_ads_iframe_/,
    /__container__$/,
    /^geniee_/,
    /^gn_interstitial/, // Genieeインタースティシャル広告
    /^yads\d+/,
    /^gn_delivery_/,
    /^gnpbad_/, // Geniee広告のiframe ID
    /^155\d+/, // 広告関連の数字ID
    /^158\d+/, // Geniee広告の数字ID（1582336, 1582337など）
    /^canv_/,
    /^ima_/,
    /google-rewarded/,
    /^ps_caff$/, // FencedFrame広告ID
    /^ufret-ad-close$/, // 広告の閉じるボタン
    /^carouselExampleIndicators$/, // カルーセル広告要素
    /^carouselIndicators$/ // カルーセル広告要素（新バージョン）
  ];

  // 削除対象のクラスパターン（正規表現）
  const CLASS_PATTERNS = [
    /yads_ad/,
    /videoAdUi/,
    /ima-sdk/,
    /ad-content/,
    /full-screen-ad/, // フルスクリーン広告
    /ufret-ad-close/, // 広告の閉じるボタン
    /gn_interstitial/, // Genieeインタースティシャル広告
    /fc-dialog-overlay/, // ダイアログオーバーレイ（広告関連）
    /fc-monetization-dialog/, // 広告視聴要求ダイアログ
    /^fc-/ // fc-で始まるクラス（広告関連ダイアログ全般）
  ];

  // 要素を削除する関数
  function removeElement(element) {
    if (element && element.parentNode) {
      try {
        element.remove();
      } catch (e) {
        // エラーは無視（要素が既に削除されている場合など）
      }
    }
  }

  // セレクタに一致する要素を削除
  function removeBySelectors() {
    let removedCount = 0;

    Object.values(SELECTORS).flat().forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          removeElement(element);
          removedCount++;
        });
      } catch (e) {
        console.error('[U-FRET Ad Blocker] セレクタエラー:', selector, e);
      }
    });

    return removedCount;
  }

  // IDパターンに一致する要素を削除
  function removeByIDPatterns() {
    let removedCount = 0;

    ID_PATTERNS.forEach(pattern => {
      try {
        const elements = document.querySelectorAll('[id]');
        elements.forEach(element => {
          const id = element.id;
          if (id && pattern.test(id)) {
            removeElement(element);
            removedCount++;
          }
        });
      } catch (e) {
        console.error('[U-FRET Ad Blocker] IDパターンエラー:', pattern, e);
      }
    });

    return removedCount;
  }

  // クラスパターンに一致する要素を削除
  function removeByClassPatterns() {
    let removedCount = 0;

    CLASS_PATTERNS.forEach(pattern => {
      try {
        const elements = document.querySelectorAll('[class]');
        elements.forEach(element => {
          const className = element.className;
          if (className && typeof className === 'string' && pattern.test(className)) {
            // 広告要素かどうかを確認
            if (isAdElement(element)) {
              removeElement(element);
              removedCount++;
            }
          }
        });
      } catch (e) {
        console.error('[U-FRET Ad Blocker] クラスパターンエラー:', pattern, e);
      }
    });

    return removedCount;
  }

  // 広告要素かどうかを判定
  function isAdElement(element) {
    // iframe要素で広告関連の属性がある場合
    if (element.tagName === 'IFRAME') {
      const title = element.getAttribute('title') || '';
      const ariaLabel = element.getAttribute('aria-label') || '';
      const src = element.getAttribute('src') || '';

      if (title.includes('広告') ||
        ariaLabel.includes('広告') ||
        src.includes('googleads') ||
        src.includes('doubleclick') ||
        src.includes('googlesyndication')) {
        return true;
      }
    }

    // 親要素に広告関連のクラスやIDがある場合
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      const parentId = parent.id || '';
      const parentClass = parent.className || '';

      if (ID_PATTERNS.some(p => p.test(parentId)) ||
        CLASS_PATTERNS.some(p => p.test(parentClass))) {
        return true;
      }

      parent = parent.parentElement;
      depth++;
    }

    return false;
  }

  // 広告関連のスクリプトを削除
  function removeAdScripts() {
    let removedCount = 0;

    SELECTORS.adScripts.forEach(selector => {
      try {
        const scripts = document.querySelectorAll(selector);
        scripts.forEach(script => {
          removeElement(script);
          removedCount++;
        });
      } catch (e) {
        // エラーは無視
      }
    });

    // rtct_adp_libなどの広告ライブラリスクリプトも削除
    try {
      const adLibScripts = document.querySelectorAll('script[src*="rtct_adp_lib"], script[src*="gpb_"]');
      adLibScripts.forEach(script => {
        removeElement(script);
        removedCount++;
      });
    } catch (e) {
      // エラーは無視
    }

    return removedCount;
  }

  // 広告関連のイベントリスナーを無効化
  function disableAdEventListeners() {
    // addEventListenerをオーバーライドして広告関連のイベントをブロック
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      // 広告関連の要素のイベントをブロック
      if (this && this.id) {
        const id = this.id;
        if (
          id.includes('geniee') ||
          id.includes('gpb_') ||
          id.includes('google_ads') ||
          id.includes('yads') ||
          id.includes('gn_') ||
          id.includes('fc-') ||
          id.includes('155') ||
          id.includes('158')
        ) {
          return; // 広告要素のイベントリスナーをブロック
        }
      }

      // 広告関連のクラスを持つ要素のイベントをブロック
      if (this && this.className && typeof this.className === 'string') {
        const className = this.className;
        if (
          className.includes('geniee') ||
          className.includes('yads') ||
          className.includes('google') ||
          className.includes('fc-') ||
          className.includes('ad-')
        ) {
          return; // 広告要素のイベントリスナーをブロック
        }
      }

      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // 広告スクリプトのエラーをキャッチしてスクロール位置を保護
  function protectScrollFromErrors() {
    // 既に最初に設定済み（最優先で設定）
    return;
  }

  // 非表示の広告iframeを削除
  function removeHiddenAdIframes() {
    let removedCount = 0;

    SELECTORS.hiddenAdIframes.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // 非表示のiframeで広告関連のURLを含む場合のみ削除
          const src = element.getAttribute('src') || '';
          if (src.includes('sodar') ||
            src.includes('googlesyndication') ||
            src.includes('doubleclick') ||
            element.style.display === 'none' ||
            element.getAttribute('width') === '0') {
            removeElement(element);
            removedCount++;
          }
        });
      } catch (e) {
        // エラーは無視
      }
    });

    return removedCount;
  }

  // メインの削除処理
  function removeAds() {
    let totalRemoved = 0;

    totalRemoved += removeBySelectors();
    totalRemoved += removeByIDPatterns();
    totalRemoved += removeByClassPatterns();
    totalRemoved += removeAdScripts();
    totalRemoved += removeHiddenAdIframes();

    // 広告削除後にスクロールを有効化
    enableScroll();

    return totalRemoved;
  }

  // 統計情報を保持
  let stats = {
    removedCount: 0,
    lastRemovedTime: null
  };

  // メインの削除処理（統計情報を更新）
  const originalRemoveAds = removeAds;
  removeAds = function () {
    const count = originalRemoveAds();
    if (count > 0) {
      stats.removedCount += count;
      stats.lastRemovedTime = Date.now();
    }
    return count;
  };

  // Popupからのメッセージを受信
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getStats') {
        sendResponse({
          removedCount: stats.removedCount,
          lastRemovedTime: stats.lastRemovedTime
        });
        return true;
      }
    });
  }

  // スクロールを有効化する関数（包括的対応）
  function enableScroll() {
    const body = document.body;
    const html = document.documentElement;

    if (body) {
      // overflowスタイルの強制解除
      const bodyStyle = window.getComputedStyle(body);
      if (bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden') {
        body.style.overflow = '';
        body.style.overflowY = '';
      }

      // position: fixedの解除（モーダルなどで設定される場合がある）
      if (bodyStyle.position === 'fixed') {
        body.style.position = '';
      }

      // height: 100%の解除
      if (bodyStyle.height === '100%' && bodyStyle.overflow === 'hidden') {
        body.style.height = '';
      }

      // Bootstrapモーダルの.modal-openクラスを削除
      if (body.classList.contains('modal-open')) {
        body.classList.remove('modal-open');
      }

      // ハンバーガーメニューのactive状態を確認（必要に応じて）
      const nav = document.getElementById('js-nav');
      const back = document.getElementById('js-back');
      if (nav && nav.classList.contains('active')) {
        // メニューが開いている場合は閉じる（オプション）
        // nav.classList.remove('active');
      }
      if (back && back.classList.contains('active')) {
        // back.classList.remove('active');
      }
    }

    if (html) {
      const htmlStyle = window.getComputedStyle(html);
      if (htmlStyle.overflow === 'hidden' || htmlStyle.overflowY === 'hidden') {
        html.style.overflow = '';
        html.style.overflowY = '';
      }

      // position: fixedの解除
      if (htmlStyle.position === 'fixed') {
        html.style.position = '';
      }
    }

    // jQueryのscrollTopアニメーションを無効化（干渉を防ぐ）
    if (typeof jQuery !== 'undefined' && typeof jQuery.fn !== 'undefined') {
      const originalAnimate = jQuery.fn.animate;
      jQuery.fn.animate = function (prop, speed, easing, callback) {
        // scrollTop: 0のアニメーションをブロック
        if (prop && typeof prop === 'object' && prop.scrollTop === 0) {
          return this;
        }
        return originalAnimate.apply(this, arguments);
      };

      // scrollTopの直接設定もブロック
      const originalScrollTop = jQuery.fn.scrollTop;
      jQuery.fn.scrollTop = function (value) {
        if (value === 0 || value === '0') {
          return this;
        }
        return originalScrollTop.apply(this, arguments);
      };
    }

    // ネイティブのscrollTo/scrollを常に監視・ブロック
    const originalScrollTo = window.scrollTo;
    const originalScroll = window.scroll;

    window.scrollTo = function (x, y) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      // スクロール位置が50px以上の場合、0へのスクロールをブロック
      if (currentScroll > 50) {
        if (y === 0 || (typeof x === 'object' && x && x.top === 0 && x.left === 0)) {
          return; // scrollTop: 0をブロック
        }
      }
      return originalScrollTo.apply(this, arguments);
    };

    window.scroll = function (x, y) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      // スクロール位置が50px以上の場合、0へのスクロールをブロック
      if (currentScroll > 50) {
        if (y === 0 || (typeof x === 'object' && x && x.top === 0 && x.left === 0)) {
          return; // scrollTop: 0をブロック
        }
      }
      return originalScroll.apply(this, arguments);
    };

    // scrollIntoViewも監視
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      const currentPos = window.pageYOffset || document.documentElement.scrollTop;
      if (currentPos > 50) {
        // スクロール位置が50px以上の場合、トップへのスクロールをブロック
        if (!options || (options.block === 'start' && currentPos > 50)) {
          return;
        }
      }
      return originalScrollIntoView.apply(this, arguments);
    };

    // スクロール位置の自動復元（強力版）
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let scrollProtectionActive = false;

    const protectScrollPosition = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const bodyScrollTop = document.body.scrollTop || 0;

      // 突然0に戻された場合、直前の位置を復元
      if (lastScrollTop > 50 && currentScrollTop === 0 && bodyScrollTop === 0 && !scrollProtectionActive) {
        scrollProtectionActive = true;
        setTimeout(() => {
          if (originalScrollTo) {
            originalScrollTo.call(window, 0, lastScrollTop);
          }
          scrollProtectionActive = false;
        }, 10);
      } else if (currentScrollTop > 0) {
        lastScrollTop = currentScrollTop;
      }
    };

    // より頻繁に監視（50ms間隔）
    setInterval(protectScrollPosition, 50);

    // scrollイベントでも監視（タップ時の自動スクロールは許可）
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(protectScrollPosition, 10);
    }, { passive: true });
  }

  // MutationObserverでDOMの変更を監視（debounce付き）
  let removeTimeout = null;
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      let shouldRemove = false;
      let shouldCheckScroll = false;

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldRemove = true;
        }

        // スタイル属性の変更を監視
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target === document.body || target === document.documentElement) {
            shouldCheckScroll = true;
          }
        }
      });

      if (shouldRemove) {
        // debounce: 連続する変更をまとめて処理
        if (removeTimeout) {
          clearTimeout(removeTimeout);
        }
        removeTimeout = setTimeout(() => {
          removeAds();
          enableScroll(); // 広告削除後にスクロールを有効化
          removeTimeout = null;
        }, 50); // 100ms → 50msに短縮
      }

      if (shouldCheckScroll) {
        // スタイル変更時は即座にスクロールを有効化
        enableScroll();
      }
    });

    // documentが存在する場合のみ監視開始
    if (document.body || document.documentElement) {
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'] // styleとclass属性の変更を監視
      });
    }

    return observer;
  }

  // 早期削除: DOMが利用可能になったら即座に削除
  function earlyRemove() {
    // document.documentElementが存在する場合、即座に削除を試みる
    if (document.documentElement) {
      removeAds();
    }
  }

  // 初期化
  function init() {
    // 即座に削除を試行（document_startで実行されるため）
    earlyRemove();

    // DOMが読み込まれるまで待機
    if (document.readyState === 'loading') {
      // DOMContentLoaded前に複数回チェック
      const checkInterval = setInterval(() => {
        if (document.body) {
          removeAds();
          clearInterval(checkInterval);
        }
      }, 100);

      document.addEventListener('DOMContentLoaded', () => {
        clearInterval(checkInterval);
        removeAds();
        observeDOM();
      });
    } else {
      // 既に読み込まれている場合
      removeAds();
      observeDOM();
    }

    // ページが完全に読み込まれた後も監視を続ける
    window.addEventListener('load', () => {
      setTimeout(() => {
        removeAds();
      }, 200); // 1000ms → 200msに短縮
    });

    // bodyが追加されたら即座に削除
    if (!document.body) {
      const bodyObserver = new MutationObserver(() => {
        if (document.body) {
          removeAds();
          bodyObserver.disconnect();
        }
      });
      bodyObserver.observe(document.documentElement, {
        childList: true
      });
    }
  }

  // 広告関連のイベントリスナーを無効化（最優先）
  disableAdEventListeners();

  // スクロール保護を初期化
  protectScrollFromErrors();

  // 実行
  init();

  // 定期的なチェック（動的に追加される要素に対応）
  // 2秒 → 500msに短縮（より頻繁にチェック）
  setInterval(() => {
    removeAds();
    enableScroll(); // 定期的にスクロール状態を確認・修正
  }, 500);

  // スクロール無効化を防ぐ: bodyとhtmlのスタイル変更を監視（強化版）
  function observeScrollPrevention() {
    if (!document.body && !document.documentElement) return;

    // bodyとhtmlのスタイル変更を監視
    const styleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target;
        // style属性の変更を検出
        if (mutation.attributeName === 'style') {
          enableScroll();
        }
        // class属性の変更を検出（modal-openなど）
        if (mutation.attributeName === 'class') {
          if (target === document.body && target.classList.contains('modal-open')) {
            enableScroll();
          }
        }
      });
    });

    if (document.body) {
      styleObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    if (document.documentElement) {
      styleObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return styleObserver;
  }

  // CSSで強制的にスクロールを許可（最後の手段）
  function injectScrollCSS() {
    const styleId = 'ufret-adblocker-scroll-fix';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* U-FRET Ad Blocker: スクロール無効化対策 */
      body, html {
        overflow: auto !important;
        overflow-x: hidden !important;
      }
      body.modal-open {
        overflow: auto !important;
        position: static !important;
      }
      body[style*="overflow: hidden"],
      body[style*="overflow:hidden"] {
        overflow: auto !important;
      }
      html[style*="overflow: hidden"],
      html[style*="overflow:hidden"] {
        overflow: auto !important;
      }
    `;

    // headに追加（なければbodyに追加）
    if (document.head) {
      document.head.appendChild(style);
    } else if (document.body) {
      document.body.appendChild(style);
    } else {
      document.documentElement.appendChild(style);
    }
  }

  // スクロール監視を開始
  if (document.body || document.documentElement) {
    observeScrollPrevention();
    injectScrollCSS();
  } else {
    // bodyがまだない場合は、DOMContentLoadedを待つ
    document.addEventListener('DOMContentLoaded', () => {
      observeScrollPrevention();
      injectScrollCSS();
    });
  }

  // 即座にCSSを注入（document_startで実行されるため）
  if (document.head || document.documentElement) {
    injectScrollCSS();
  }

})();
