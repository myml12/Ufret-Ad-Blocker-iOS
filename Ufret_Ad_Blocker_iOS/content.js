// U-FRET Ad Blocker - Content Script
// eliminate.mdに記載されているDOM要素を監視して削除

(function () {
  'use strict';
  
  console.log('[U-FRET Ad Blocker] スクリプト読み込み開始:', {
    readyState: document.readyState,
    hasBody: !!document.body,
    hasDocumentElement: !!document.documentElement,
    url: window.location.href,
    timestamp: Date.now()
  });

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
    console.log('[U-FRET Ad Blocker] スクロール保護処理を初期化');
    let lastScrollTop = 0;
    let scrollProtectionActive = false;
    let userInitiatedScroll = false;
    let lastUserScrollTime = 0;
    let scrollPositionHistory = [];
    const USER_SCROLL_TIMEOUT = 2000; // ユーザーのスクロール検出タイムアウト（2秒）

    // scrollTo/scrollをオーバーライド
    const originalScrollTo = window.scrollTo;
    const originalScroll = window.scroll;

    window.scrollTo = function (x, y) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      const targetY = typeof x === 'object' && x ? x.top : y;
      console.log('[U-FRET Ad Blocker] scrollTo呼び出し:', {
        currentScroll,
        targetY,
        x,
        y,
        timestamp: Date.now()
      });
      lastScrollTop = currentScroll;

      // スクロール位置が50px以上の場合、0へのスクロールをブロック
      if (currentScroll > 50) {
        if (y === 0 || (typeof x === 'object' && x && x.top === 0 && x.left === 0)) {
          console.log('[U-FRET Ad Blocker] scrollTo(0)をブロック:', {
            currentScroll,
            lastScrollTop,
            timestamp: Date.now()
          });
          return; // scrollTop: 0をブロック
        }
      }
      console.log('[U-FRET Ad Blocker] scrollToを許可:', {
        currentScroll,
        targetY,
        timestamp: Date.now()
      });
      return originalScrollTo.apply(this, arguments);
    };

    window.scroll = function (x, y) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      const targetY = typeof x === 'object' && x ? x.top : y;
      console.log('[U-FRET Ad Blocker] scroll呼び出し:', {
        currentScroll,
        targetY,
        x,
        y,
        timestamp: Date.now()
      });
      lastScrollTop = currentScroll;

      // スクロール位置が50px以上の場合、0へのスクロールをブロック
      if (currentScroll > 50) {
        if (y === 0 || (typeof x === 'object' && x && x.top === 0 && x.left === 0)) {
          console.log('[U-FRET Ad Blocker] scroll(0)をブロック:', {
            currentScroll,
            lastScrollTop,
            timestamp: Date.now()
          });
          return; // scrollTop: 0をブロック
        }
      }
      console.log('[U-FRET Ad Blocker] scrollを許可:', {
        currentScroll,
        targetY,
        timestamp: Date.now()
      });
      return originalScroll.apply(this, arguments);
    };

    // scrollIntoViewも監視
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
      console.log('[U-FRET Ad Blocker] scrollIntoView呼び出し:', {
        currentPos,
        options,
        element: this.tagName + (this.id ? '#' + this.id : ''),
        timestamp: Date.now()
      });
      if (currentPos > 50) {
        // スクロール位置が50px以上の場合、トップへのスクロールをブロック
        if (!options || (options.block === 'start' && currentPos > 50)) {
          console.log('[U-FRET Ad Blocker] scrollIntoView(block: start)をブロック:', {
            currentPos,
            timestamp: Date.now()
          });
          return;
        }
      }
      console.log('[U-FRET Ad Blocker] scrollIntoViewを許可:', {
        currentPos,
        options,
        timestamp: Date.now()
      });
      return originalScrollIntoView.apply(this, arguments);
    };

    // ユーザーによるスクロールを検出（より確実に）
    ['wheel', 'touchstart', 'touchmove', 'keydown', 'mousedown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
        userInitiatedScroll = true;
        lastUserScrollTime = Date.now();
        console.log('[U-FRET Ad Blocker] ユーザー操作を検出:', {
          eventType,
          currentScroll,
          timestamp: Date.now()
        });
        // スクロール位置を記録
        scrollPositionHistory.push({ time: Date.now(), position: currentScroll });
        // 履歴は最新10件のみ保持
        if (scrollPositionHistory.length > 10) {
          scrollPositionHistory.shift();
        }
      }, { passive: true });
    });

    // スクロール位置の自動復元（ユーザーのスクロール中は絶対に実行しない）
    const protectScrollPosition = () => {
      const now = Date.now();
      const timeSinceLastUserScroll = now - lastUserScrollTime;
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const bodyScrollTop = document.body ? document.body.scrollTop || 0 : 0;
      
      console.log('[U-FRET Ad Blocker] protectScrollPosition実行:', {
        currentScrollTop,
        bodyScrollTop,
        lastScrollTop,
        userInitiatedScroll,
        timeSinceLastUserScroll,
        scrollProtectionActive,
        timestamp: Date.now()
      });
      
      // ユーザーが最近スクロールした場合は、復元処理を完全にスキップ
      if (userInitiatedScroll && timeSinceLastUserScroll < USER_SCROLL_TIMEOUT) {
        // ユーザーのスクロール位置を更新
        if (currentScrollTop > 0) {
          lastScrollTop = currentScrollTop;
        }
        console.log('[U-FRET Ad Blocker] ユーザーのスクロール中 - 復元処理をスキップ:', {
          currentScrollTop,
          lastScrollTop,
          timeSinceLastUserScroll,
          timestamp: Date.now()
        });
        return; // ユーザーのスクロール中は復元処理を実行しない
      }

      // ユーザーのスクロールが終了したことを確認
      if (timeSinceLastUserScroll >= USER_SCROLL_TIMEOUT) {
        if (userInitiatedScroll) {
          console.log('[U-FRET Ad Blocker] ユーザーのスクロール終了を検出:', {
            timeSinceLastUserScroll,
            timestamp: Date.now()
          });
        }
        userInitiatedScroll = false;
      }

      // スクロール位置が変化している場合は、ユーザーのスクロールの可能性があるので復元しない
      if (scrollPositionHistory.length >= 2) {
        const recentPositions = scrollPositionHistory.slice(-3);
        const isPositionChanging = recentPositions.some((pos, index) => {
          if (index === 0) return false;
          return Math.abs(pos.position - recentPositions[index - 1].position) > 5;
        });
        if (isPositionChanging && timeSinceLastUserScroll < USER_SCROLL_TIMEOUT * 2) {
          // 位置が変化している場合は、ユーザーのスクロールの可能性が高い
          if (currentScrollTop > 0) {
            lastScrollTop = currentScrollTop;
          }
          console.log('[U-FRET Ad Blocker] スクロール位置が変化中 - 復元処理をスキップ:', {
            currentScrollTop,
            lastScrollTop,
            isPositionChanging,
            timeSinceLastUserScroll,
            timestamp: Date.now()
          });
          return;
        }
      }

      // 突然0に戻された場合のみ、直前の位置を復元（ユーザーのスクロール中でないことを確認）
      const shouldRestore = lastScrollTop > 50 && currentScrollTop === 0 && bodyScrollTop === 0 && !scrollProtectionActive && !userInitiatedScroll && timeSinceLastUserScroll >= USER_SCROLL_TIMEOUT;
      console.log('[U-FRET Ad Blocker] 復元判定:', {
        shouldRestore,
        lastScrollTop,
        currentScrollTop,
        bodyScrollTop,
        scrollProtectionActive,
        userInitiatedScroll,
        timeSinceLastUserScroll,
        timestamp: Date.now()
      });

      if (shouldRestore) {
        scrollProtectionActive = true;
        console.log('[U-FRET Ad Blocker] スクロール位置を復元予定:', {
          lastScrollTop,
          currentScrollTop,
          timestamp: Date.now()
        });
        setTimeout(() => {
          // 再度確認：ユーザーがスクロールしていないことを確認
          const checkTime = Date.now();
          const checkTimeSinceLastUserScroll = checkTime - lastUserScrollTime;
          const checkScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
          const shouldActuallyRestore = !userInitiatedScroll && checkTimeSinceLastUserScroll >= USER_SCROLL_TIMEOUT && checkScrollTop === 0 && originalScrollTo && lastScrollTop > 0;
          
          console.log('[U-FRET Ad Blocker] 復元実行前の再確認:', {
            shouldActuallyRestore,
            checkScrollTop,
            lastScrollTop,
            userInitiatedScroll,
            checkTimeSinceLastUserScroll,
            timestamp: Date.now()
          });

          if (shouldActuallyRestore) {
            console.log('[U-FRET Ad Blocker] スクロール位置を復元実行:', {
              from: checkScrollTop,
              to: lastScrollTop,
              timestamp: Date.now()
            });
            originalScrollTo.call(window, 0, lastScrollTop);
          } else {
            console.log('[U-FRET Ad Blocker] 復元をキャンセル:', {
              reason: !userInitiatedScroll ? 'userInitiatedScroll=true' : 
                      checkTimeSinceLastUserScroll < USER_SCROLL_TIMEOUT ? 'timeSinceLastUserScroll < timeout' :
                      checkScrollTop !== 0 ? 'checkScrollTop !== 0' : 'other',
              checkScrollTop,
              lastScrollTop,
              userInitiatedScroll,
              checkTimeSinceLastUserScroll,
              timestamp: Date.now()
            });
          }
          scrollProtectionActive = false;
        }, 50); // 10ms → 50msに延長して、ユーザーのスクロールを確実に検出
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

    // 監視頻度を下げる（30ms → 200ms）ユーザーのスクロールを妨げないように
    console.log('[U-FRET Ad Blocker] setIntervalでスクロール保護を開始 (200ms間隔)');
    setInterval(protectScrollPosition, 200);

    // scrollイベントでも監視（ただし、ユーザーのスクロール中は実行しない）
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      console.log('[U-FRET Ad Blocker] scrollイベント発生:', {
        currentScroll,
        timestamp: Date.now()
      });
      // スクロール位置を記録
      scrollPositionHistory.push({ time: Date.now(), position: currentScroll });
      if (scrollPositionHistory.length > 10) {
        scrollPositionHistory.shift();
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // ユーザーのスクロール中でない場合のみ実行
        const now = Date.now();
        const timeSinceLastUserScroll = now - lastUserScrollTime;
        const shouldCallProtect = !userInitiatedScroll || timeSinceLastUserScroll >= USER_SCROLL_TIMEOUT;
        console.log('[U-FRET Ad Blocker] scrollイベントからprotectScrollPosition呼び出し:', {
          shouldCallProtect,
          userInitiatedScroll,
          timeSinceLastUserScroll,
          timestamp: Date.now()
        });
        if (shouldCallProtect) {
          protectScrollPosition();
        }
      }, 100); // 10ms → 100msに延長
    }, { passive: true });
    console.log('[U-FRET Ad Blocker] scrollイベントリスナーを登録完了');
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
    console.log('[U-FRET Ad Blocker] removeAds()開始:', {
      timestamp: Date.now()
    });
    let totalRemoved = 0;

    const removedBySelectors = removeBySelectors();
    const removedByID = removeByIDPatterns();
    const removedByClass = removeByClassPatterns();
    const removedScripts = removeAdScripts();
    const removedIframes = removeHiddenAdIframes();
    
    totalRemoved = removedBySelectors + removedByID + removedByClass + removedScripts + removedIframes;

    if (totalRemoved > 0) {
      console.log('[U-FRET Ad Blocker] 広告要素を削除:', {
        bySelectors: removedBySelectors,
        byID: removedByID,
        byClass: removedByClass,
        scripts: removedScripts,
        iframes: removedIframes,
        total: totalRemoved,
        timestamp: Date.now()
      });
    }

    // 広告削除後にスクロールを有効化
    enableScroll();

    console.log('[U-FRET Ad Blocker] removeAds()完了:', {
      totalRemoved,
      timestamp: Date.now()
    });
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
    console.log('[U-FRET Ad Blocker] enableScroll()呼び出し:', {
      timestamp: Date.now()
    });
    const body = document.body;
    const html = document.documentElement;

    if (body) {
      // overflowスタイルの強制解除
      const bodyStyle = window.getComputedStyle(body);
      const bodyOverflow = bodyStyle.overflow;
      const bodyOverflowY = bodyStyle.overflowY;
      const bodyPosition = bodyStyle.position;
      const bodyHeight = bodyStyle.height;
      
      if (bodyOverflow === 'hidden' || bodyOverflowY === 'hidden') {
        console.log('[U-FRET Ad Blocker] bodyのoverflowを解除:', {
          before: { overflow: bodyOverflow, overflowY: bodyOverflowY },
          timestamp: Date.now()
        });
        body.style.overflow = '';
        body.style.overflowY = '';
      }

      // position: fixedの解除（モーダルなどで設定される場合がある）
      if (bodyPosition === 'fixed') {
        console.log('[U-FRET Ad Blocker] bodyのposition: fixedを解除:', {
          timestamp: Date.now()
        });
        body.style.position = '';
      }

      // height: 100%の解除
      if (bodyHeight === '100%' && bodyOverflow === 'hidden') {
        console.log('[U-FRET Ad Blocker] bodyのheight: 100%を解除:', {
          timestamp: Date.now()
        });
        body.style.height = '';
      }

      // Bootstrapモーダルの.modal-openクラスを削除
      if (body.classList.contains('modal-open')) {
        console.log('[U-FRET Ad Blocker] bodyのmodal-openクラスを削除:', {
          timestamp: Date.now()
        });
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
      const htmlOverflow = htmlStyle.overflow;
      const htmlOverflowY = htmlStyle.overflowY;
      const htmlPosition = htmlStyle.position;
      
      if (htmlOverflow === 'hidden' || htmlOverflowY === 'hidden') {
        console.log('[U-FRET Ad Blocker] htmlのoverflowを解除:', {
          before: { overflow: htmlOverflow, overflowY: htmlOverflowY },
          timestamp: Date.now()
        });
        html.style.overflow = '';
        html.style.overflowY = '';
      }

      // position: fixedの解除
      if (htmlPosition === 'fixed') {
        console.log('[U-FRET Ad Blocker] htmlのposition: fixedを解除:', {
          timestamp: Date.now()
        });
        html.style.position = '';
      }
    }

    // jQueryのscrollTopアニメーションを無効化（干渉を防ぐ）
    if (typeof jQuery !== 'undefined' && typeof jQuery.fn !== 'undefined') {
      console.log('[U-FRET Ad Blocker] jQueryのscrollTopアニメーションを無効化:', {
        timestamp: Date.now()
      });
      const originalAnimate = jQuery.fn.animate;
      jQuery.fn.animate = function (prop, speed, easing, callback) {
        // scrollTop: 0のアニメーションをブロック
        if (prop && typeof prop === 'object' && prop.scrollTop === 0) {
          console.log('[U-FRET Ad Blocker] jQuery.animate(scrollTop: 0)をブロック:', {
            timestamp: Date.now()
          });
          return this;
        }
        return originalAnimate.apply(this, arguments);
      };

      // scrollTopの直接設定もブロック
      const originalScrollTop = jQuery.fn.scrollTop;
      jQuery.fn.scrollTop = function (value) {
        if (value === 0 || value === '0') {
          console.log('[U-FRET Ad Blocker] jQuery.scrollTop(0)をブロック:', {
            timestamp: Date.now()
          });
          return this;
        }
        return originalScrollTop.apply(this, arguments);
      };
    }

    // ネイティブのscrollTo/scrollを常に監視・ブロック
    // 注意: 最初のスクロール保護処理（230-340行目）で既にオーバーライドされているため、
    // ここでは重複を避ける（enableScroll()は広告削除後のスクロール有効化のみに集中）
    console.log('[U-FRET Ad Blocker] enableScroll()完了:', {
      timestamp: Date.now()
    });
  }

  // MutationObserverでDOMの変更を監視（debounce付き）
  let removeTimeout = null;
  function observeDOM() {
    console.log('[U-FRET Ad Blocker] MutationObserverを開始:', {
      timestamp: Date.now()
    });
    const observer = new MutationObserver((mutations) => {
      let shouldRemove = false;
      let shouldCheckScroll = false;
      let addedNodesCount = 0;
      let styleChangeCount = 0;

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldRemove = true;
          addedNodesCount += mutation.addedNodes.length;
        }

        // スタイル属性の変更を監視
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target === document.body || target === document.documentElement) {
            shouldCheckScroll = true;
            styleChangeCount++;
          }
        }
      });

      if (shouldRemove) {
        console.log('[U-FRET Ad Blocker] DOM変更を検出 (広告削除予定):', {
          addedNodesCount,
          timestamp: Date.now()
        });
        // debounce: 連続する変更をまとめて処理
        if (removeTimeout) {
          clearTimeout(removeTimeout);
        }
        removeTimeout = setTimeout(() => {
          console.log('[U-FRET Ad Blocker] DOM変更から広告削除を実行:', {
            timestamp: Date.now()
          });
          removeAds();
          enableScroll(); // 広告削除後にスクロールを有効化
          removeTimeout = null;
        }, 50); // 100ms → 50msに短縮
      }

      if (shouldCheckScroll) {
        console.log('[U-FRET Ad Blocker] スタイル変更を検出 (スクロール有効化):', {
          styleChangeCount,
          timestamp: Date.now()
        });
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
    console.log('[U-FRET Ad Blocker] earlyRemove()実行:', {
      hasDocumentElement: !!document.documentElement,
      timestamp: Date.now()
    });
    // document.documentElementが存在する場合、即座に削除を試みる
    if (document.documentElement) {
      removeAds();
    }
  }

  // 初期化
  function init() {
    console.log('[U-FRET Ad Blocker] init()開始:', {
      readyState: document.readyState,
      hasBody: !!document.body,
      hasDocumentElement: !!document.documentElement,
      timestamp: Date.now()
    });
    // 即座に削除を試行（document_startで実行されるため）
    earlyRemove();

    // DOMが読み込まれるまで待機
    if (document.readyState === 'loading') {
      console.log('[U-FRET Ad Blocker] DOM読み込み待機中:', {
        timestamp: Date.now()
      });
      // DOMContentLoaded前に複数回チェック
      const checkInterval = setInterval(() => {
        if (document.body) {
          console.log('[U-FRET Ad Blocker] body検出 - 広告削除実行:', {
            timestamp: Date.now()
          });
          removeAds();
          clearInterval(checkInterval);
        }
      }, 100);

      document.addEventListener('DOMContentLoaded', () => {
        console.log('[U-FRET Ad Blocker] DOMContentLoadedイベント:', {
          timestamp: Date.now()
        });
        clearInterval(checkInterval);
        removeAds();
        observeDOM();
      });
    } else {
      console.log('[U-FRET Ad Blocker] DOM既に読み込み済み:', {
        readyState: document.readyState,
        timestamp: Date.now()
      });
      // 既に読み込まれている場合
      removeAds();
      observeDOM();
    }

    // ページが完全に読み込まれた後も監視を続ける
    window.addEventListener('load', () => {
      console.log('[U-FRET Ad Blocker] window.loadイベント:', {
        timestamp: Date.now()
      });
      setTimeout(() => {
        console.log('[U-FRET Ad Blocker] window.load後 - 広告削除実行:', {
          timestamp: Date.now()
        });
        removeAds();
      }, 200); // 1000ms → 200msに短縮
    });

    // bodyが追加されたら即座に削除
    if (!document.body) {
      console.log('[U-FRET Ad Blocker] body待機Observerを開始:', {
        timestamp: Date.now()
      });
      const bodyObserver = new MutationObserver(() => {
        if (document.body) {
          console.log('[U-FRET Ad Blocker] body検出 (Observer) - 広告削除実行:', {
            timestamp: Date.now()
          });
          removeAds();
          bodyObserver.disconnect();
        }
      });
      bodyObserver.observe(document.documentElement, {
        childList: true
      });
    }
    console.log('[U-FRET Ad Blocker] init()完了:', {
      timestamp: Date.now()
    });
  }

  // 広告関連のイベントリスナーを無効化（最優先）
  console.log('[U-FRET Ad Blocker] 広告イベントリスナー無効化を開始:', {
    timestamp: Date.now()
  });
  disableAdEventListeners();

  // スクロール保護を初期化
  console.log('[U-FRET Ad Blocker] スクロール保護エラー処理を開始:', {
    timestamp: Date.now()
  });
  protectScrollFromErrors();

  // 実行
  console.log('[U-FRET Ad Blocker] スクリプト初期化開始:', {
    timestamp: Date.now()
  });
  init();

  // 定期的なチェック（動的に追加される要素に対応）
  // 2秒 → 500msに短縮（より頻繁にチェック）
  console.log('[U-FRET Ad Blocker] 定期チェックを開始 (500ms間隔):', {
    timestamp: Date.now()
  });
  setInterval(() => {
    removeAds();
    enableScroll(); // 定期的にスクロール状態を確認・修正
  }, 500);

  // スクロール無効化を防ぐ: bodyとhtmlのスタイル変更を監視（強化版）
  function observeScrollPrevention() {
    if (!document.body && !document.documentElement) {
      console.log('[U-FRET Ad Blocker] observeScrollPrevention() - body/htmlが存在しない:', {
        timestamp: Date.now()
      });
      return;
    }

    console.log('[U-FRET Ad Blocker] observeScrollPrevention()開始:', {
      hasBody: !!document.body,
      hasDocumentElement: !!document.documentElement,
      timestamp: Date.now()
    });

    // bodyとhtmlのスタイル変更を監視
    const styleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target;
        // style属性の変更を検出
        if (mutation.attributeName === 'style') {
          console.log('[U-FRET Ad Blocker] スタイル変更検出 (observeScrollPrevention):', {
            target: target === document.body ? 'body' : target === document.documentElement ? 'html' : target.tagName,
            timestamp: Date.now()
          });
          enableScroll();
        }
        // class属性の変更を検出（modal-openなど）
        if (mutation.attributeName === 'class') {
          if (target === document.body && target.classList.contains('modal-open')) {
            console.log('[U-FRET Ad Blocker] modal-openクラス検出:', {
              timestamp: Date.now()
            });
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
      console.log('[U-FRET Ad Blocker] bodyのスタイル監視を開始:', {
        timestamp: Date.now()
      });
    }

    if (document.documentElement) {
      styleObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      console.log('[U-FRET Ad Blocker] htmlのスタイル監視を開始:', {
        timestamp: Date.now()
      });
    }

    return styleObserver;
  }

  // CSSで強制的にスクロールを許可（最後の手段）
  function injectScrollCSS() {
    const styleId = 'ufret-adblocker-scroll-fix';
    if (document.getElementById(styleId)) {
      console.log('[U-FRET Ad Blocker] injectScrollCSS() - 既に注入済み:', {
        timestamp: Date.now()
      });
      return;
    }

    console.log('[U-FRET Ad Blocker] injectScrollCSS()実行:', {
      hasHead: !!document.head,
      hasBody: !!document.body,
      hasDocumentElement: !!document.documentElement,
      timestamp: Date.now()
    });

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
      console.log('[U-FRET Ad Blocker] CSSをheadに注入:', {
        timestamp: Date.now()
      });
    } else if (document.body) {
      document.body.appendChild(style);
      console.log('[U-FRET Ad Blocker] CSSをbodyに注入:', {
        timestamp: Date.now()
      });
    } else {
      document.documentElement.appendChild(style);
      console.log('[U-FRET Ad Blocker] CSSをdocumentElementに注入:', {
        timestamp: Date.now()
      });
    }
  }

  // スクロール監視を開始
  if (document.body || document.documentElement) {
    console.log('[U-FRET Ad Blocker] スクロール監視を開始:', {
      timestamp: Date.now()
    });
    observeScrollPrevention();
    injectScrollCSS();
  } else {
    console.log('[U-FRET Ad Blocker] DOMContentLoadedを待機してスクロール監視を開始:', {
      timestamp: Date.now()
    });
    // bodyがまだない場合は、DOMContentLoadedを待つ
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[U-FRET Ad Blocker] DOMContentLoaded - スクロール監視を開始:', {
        timestamp: Date.now()
      });
      observeScrollPrevention();
      injectScrollCSS();
    });
  }

  // 即座にCSSを注入（document_startで実行されるため）
  if (document.head || document.documentElement) {
    console.log('[U-FRET Ad Blocker] 即座にCSS注入を試行:', {
      timestamp: Date.now()
    });
    injectScrollCSS();
  }

})();
