//
//  WebViewContainer.swift
//  Ufret_Ad_Blocker_iOS
//
//  Created by Yusuke Mizuno on 2026/01/21.
//

import SwiftUI
import WebKit

struct WebViewContainer: UIViewRepresentable {
    @Binding var urlString: String
    var canGoBack: Binding<Bool>?
    var canGoForward: Binding<Bool>?
    var isLoading: Binding<Bool>?
    var goBackTrigger: Binding<Bool>?
    var goForwardTrigger: Binding<Bool>?
    var reloadTrigger: Binding<Bool>?
    
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        
        // 広告ブロック用のJavaScriptを注入（DOM要素の削除のみ）
        let userContentController = WKUserContentController()
        
        // JSからSwiftへ通知を送るための名前を登録
        userContentController.add(context.coordinator, name: "adBlockFinished")
        
        // シンプルな広告要素削除スクリプト
        let adRemovalScript = """
        (function() {
            'use strict';
            
            // 広告要素のセレクタ（content.jsから必要なもののみ）
            const adSelectors = [
                // Google広告関連
                '[id^="google_ads_iframe_"]',
                'iframe[title*="広告"]',
                'iframe[aria-label*="広告"]',
                'iframe[src*="googleads"]',
                'iframe[src*="doubleclick"]',
                'iframe[src*="googlesyndication"]',
                // Geniee広告関連
                '#geniee_overlay_outer',
                '#geniee_overlay_inner',
                '#geniee_overlay_close',
                '#gn_interstitial_outer_area',
                '.gn_interstitial_outer_area',
                '#gn_interstitial_inner_area',
                '.gn_interstitial_inner_area',
                '#gn_interstitial_close',
                '.gn_interstitial_close',
                '[id^="gnpbad_"]',
                // YADS広告関連
                '[id^="yads"]',
                '[class*="yads_ad"]',
                '[id^="gn_delivery_"]',
                // その他の広告要素
                '#move-page-top',
                'a[href="#musical-score-header"]',
                '.ad-content-inter',
                '.fc-dialog-overlay',
                '.fc-monetization-dialog',
                '.fc-rewarded-ad-button',
                '#full-screen-ad',
                '.full-screen-ad',
                '#ufret-ad-close',
                '.ufret-ad-close',
                '[id*="google_ads"]',
                '[id*="google-rewarded"]',
                '[class*="videoAdUi"]',
                '[class*="ima-sdk"]',
                '[id*="ima_"]',
                'fencedframe[id="ps_caff"]',
                'fencedframe#ps_caff'
            ];
            
            // IDパターン（正規表現）
            const idPatterns = [
                /^google_ads_iframe_/,
                /__container__$/,
                /^geniee_/,
                /^gn_interstitial/,
                /^yads\\d+/,
                /^gn_delivery_/,
                /^gnpbad_/,
                /^155\\d+/,
                /^158\\d+/,
                /^canv_/,
                /^ima_/,
                /google-rewarded/,
                /^ps_caff$/,
                /^ufret-ad-close$/,
                /^carouselExampleIndicators$/,
                /^carouselIndicators$/
            ];
            
            // クラスパターン（正規表現）
            const classPatterns = [
                /yads_ad/,
                /videoAdUi/,
                /ima-sdk/,
                /ad-content/,
                /full-screen-ad/,
                /ufret-ad-close/,
                /gn_interstitial/,
                /fc-dialog-overlay/,
                /fc-monetization-dialog/,
                /^fc-/
            ];
            
            // 広告要素かどうかを判定
            function isAdElement(element) {
                if (!element) return false;
                
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
                
                // IDパターンチェック
                const id = element.id || '';
                if (id) {
                    for (let pattern of idPatterns) {
                        if (pattern.test(id)) {
                            return true;
                        }
                    }
                }
                
                // クラスパターンチェック
                const className = element.className || '';
                if (className && typeof className === 'string') {
                    for (let pattern of classPatterns) {
                        if (pattern.test(className)) {
                            return true;
                        }
                    }
                }
                
                // 親要素に広告関連のクラスやIDがある場合
                let parent = element.parentElement;
                let depth = 0;
                while (parent && depth < 5) {
                    const parentId = parent.id || '';
                    const parentClass = parent.className || '';
                    
                    if (parentId) {
                        for (let pattern of idPatterns) {
                            if (pattern.test(parentId)) {
                                return true;
                            }
                        }
                    }
                    
                    if (parentClass && typeof parentClass === 'string') {
                        for (let pattern of classPatterns) {
                            if (pattern.test(parentClass)) {
                                return true;
                            }
                        }
                    }
                    
                    parent = parent.parentElement;
                    depth++;
                }
                
                return false;
            }
            
            // 広告要素を削除
            function removeAds() {
                let removedCount = 0;
                
                // セレクタで削除
                adSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(element => {
                            if (isAdElement(element) && element.parentNode) {
                                element.remove();
                                removedCount++;
                            }
                        });
                    } catch (e) {
                        // エラーは無視
                    }
                });
                
                // IDパターンで削除
                try {
                    const allElements = document.querySelectorAll('[id]');
                    allElements.forEach(element => {
                        if (isAdElement(element) && element.parentNode) {
                            element.remove();
                            removedCount++;
                        }
                    });
                } catch (e) {
                    // エラーは無視
                }
                
                // クラスパターンで削除
                try {
                    const classElements = document.querySelectorAll('[class]');
                    classElements.forEach(element => {
                        if (isAdElement(element) && element.parentNode) {
                            element.remove();
                            removedCount++;
                        }
                    });
                } catch (e) {
                    // エラーは無視
                }
                
                return removedCount;
            }
            
            // 即座に削除
            removeAds();
            
            // MutationObserverで動的に追加される広告を監視
            let observerTimeout = null;
            const debouncedRemoveAds = () => {
                if (observerTimeout) {
                    clearTimeout(observerTimeout);
                }
                observerTimeout = setTimeout(() => {
                    removeAds();
                }, 100);
            };
            
            const observer = new MutationObserver(debouncedRemoveAds);
            
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['id', 'class', 'style']
                });
            } else {
                // bodyがまだない場合は、bodyが追加されるまで待つ
                const bodyObserver = new MutationObserver(() => {
                    if (document.body) {
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ['id', 'class', 'style']
                        });
                        bodyObserver.disconnect();
                    }
                });
                bodyObserver.observe(document.documentElement, {
                    childList: true
                });
            }
            
            // 定期的にチェック（補助的）
            setInterval(() => {
                removeAds();
            }, 2000);
            
            // UIの更新が完全に終わるまで待ってから通知を送る（一度だけ）
            let notified = false;
            const notifySwift = () => {
                if (!notified && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.adBlockFinished) {
                    notified = true;
                    window.webkit.messageHandlers.adBlockFinished.postMessage(true);
                }
            };
            
            // DOMContentLoadedとwindow.loadの両方を待つ
            if (document.readyState === 'complete') {
                // 既に読み込み完了している場合
                setTimeout(() => {
                    removeAds(); // 最後にもう一度削除
                    notifySwift();
                }, 500); // 500ms待ってから通知（UI更新の完了を待つ）
            } else {
                // DOMContentLoadedを待つ
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(() => {
                            removeAds();
                            notifySwift();
                        }, 500);
                    });
                }
                
                // window.loadも待つ（画像なども含めて完全に読み込み完了）
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        removeAds();
                        notifySwift();
                    }, 500);
                });
            }
        })();
        """
        
        let adRemovalUserScript = WKUserScript(
            source: adRemovalScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        userContentController.addUserScript(adRemovalUserScript)
        
        configuration.userContentController = userContentController
        
        // 広告関連のリソースをブロックするための設定
        configuration.preferences.javaScriptEnabled = true
        configuration.allowsInlineMediaPlayback = true
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        
        // WebViewの参照をCoordinatorに保存
        context.coordinator.webView = webView
        
        // 戻る/進む状態を更新
        context.coordinator.updateNavigationState(webView: webView)
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        // WebViewの参照を更新
        context.coordinator.webView = webView
        
        // 0. 読み込み中やJavaScript実行中は、すべての操作を完全にブロック
        // これにより、操作によるリクエストキャンセル（code=-999）を防ぐ
        // より厳密にチェック：いずれかがtrueなら完全にブロック
        let isCurrentlyLoading = isLoading?.wrappedValue ?? false
        let isWebViewLoading = webView.isLoading
        let isJSExecuting = context.coordinator.isLoading()
        let isInternalNav = context.coordinator.isInternalNavigation
        
        // 読み込み中、JavaScript実行中、または内部遷移中は完全にブロック
        if isCurrentlyLoading || isWebViewLoading || isJSExecuting || isInternalNav {
            // 読み込み中はすべてのトリガーをリセット（非同期で実行）
            // updateUIView内で直接Bindingを変更すると"Modifying state during view update"エラーになるため
            DispatchQueue.main.async {
                self.goBackTrigger?.wrappedValue = false
                self.goForwardTrigger?.wrappedValue = false
                self.reloadTrigger?.wrappedValue = false
            }
            return // すべての操作をブロック（URL読み込みも含む）
        }
        
        // 1. 全てのBinding操作を安全のために非同期（DispatchQueue.main.async）で行う
        // これにより "Modifying state during view update" エラーを防ぎます
        
        // 1. 全てのBinding操作を安全のために非同期（DispatchQueue.main.async）で行う
        // これにより "Modifying state during view update" エラーを防ぎます
        
        // リロードトリガーの処理（最優先）
        if let reloadTrigger = reloadTrigger, reloadTrigger.wrappedValue {
            // 念のため再度チェック（三重ガード）
            let canReload = !webView.isLoading && 
                           !(isLoading?.wrappedValue ?? false) && 
                           !context.coordinator.isLoading() &&
                           !context.coordinator.isInternalNavigation
            if canReload {
                webView.reload()
            }
            DispatchQueue.main.async {
                reloadTrigger.wrappedValue = false
            }
            return // リロード時はここで終了
        }
        
        // 戻るトリガーの処理
        if let goBackTrigger = goBackTrigger, goBackTrigger.wrappedValue {
            // 念のため再度チェック（三重ガード）
            let canGoBack = webView.canGoBack && 
                           !webView.isLoading && 
                           !(isLoading?.wrappedValue ?? false) && 
                           !context.coordinator.isLoading() &&
                           !context.coordinator.isInternalNavigation
            if canGoBack {
                webView.goBack()
            }
            DispatchQueue.main.async {
                goBackTrigger.wrappedValue = false
            }
            return
        }
        
        // 進むトリガーの処理
        if let goForwardTrigger = goForwardTrigger, goForwardTrigger.wrappedValue {
            // 念のため再度チェック（三重ガード）
            let canGoForward = webView.canGoForward && 
                              !webView.isLoading && 
                              !(isLoading?.wrappedValue ?? false) && 
                              !context.coordinator.isLoading() &&
                              !context.coordinator.isInternalNavigation
            if canGoForward {
                webView.goForward()
            }
            DispatchQueue.main.async {
                goForwardTrigger.wrappedValue = false
            }
            return
        }
        
        // 2. 読み込み中（isLoadingがtrue）の時は、新規のload命令を出さない
        // 再度チェック（確実にブロック）
        if isLoading?.wrappedValue == true || webView.isLoading || context.coordinator.isLoading() || context.coordinator.isInternalNavigation {
            return
        }
        
        // 3. 外部からのURL変更によるロード判定
        // WebView内部での遷移（リンククリック等）の場合はスキップ
        if context.coordinator.isInternalNavigation {
            return
        }
        
        // URL文字列を正規化して比較
        let standardizedBindingURL = urlString.standardizedURLString
        let standardizedWebViewURL = webView.url?.absoluteString.standardizedURLString ?? ""
        
        // 最終チェック：読み込み中でないことを確認してからロード
        if !standardizedBindingURL.isEmpty && 
           standardizedBindingURL != standardizedWebViewURL &&
           !webView.isLoading &&
           !(isLoading?.wrappedValue ?? false) &&
           !context.coordinator.isLoading() &&
           !context.coordinator.isInternalNavigation {
            if let url = URL(string: urlString) {
                webView.load(URLRequest(url: url))
                context.coordinator.lastLoadedURL = urlString
            }
        }
        
        // 戻る/進む状態を更新
        context.coordinator.updateNavigationState(webView: webView)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebViewContainer
        weak var webView: WKWebView?
        private var isLoadingInternal: Bool = false
        var lastLoadedURL: String = ""
        var isInternalNavigation: Bool = false // WebView内部での遷移かどうかのフラグ
        
        // 広告関連のURLパターン
        private let adBlockPatterns = [
            "bidr.io",
            "richaudience",
            "rtct_adp_lib",
            "gpb_",
            "googleads",
            "doubleclick",
            "googlesyndication",
            "geniee",
            "yads",
            "googlesyndication.com",
            "googleadservices.com",
            "google-analytics.com",
            "googletagmanager.com"
        ]
        
        init(_ parent: WebViewContainer) {
            self.parent = parent
        }
        
        // JSからのメッセージを受け取る関数
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "adBlockFinished" {
                DispatchQueue.main.async {
                    // ここで初めて「読み込み完了」とする
                    self.isLoadingInternal = false
                    self.parent.isLoading?.wrappedValue = false
                    
                    // 読み込み完了時に、すべてのトリガーを確実にリセット
                    self.parent.goBackTrigger?.wrappedValue = false
                    self.parent.goForwardTrigger?.wrappedValue = false
                    self.parent.reloadTrigger?.wrappedValue = false
                    
                    // 読み込み完了時に、ナビゲーション状態を更新
                    if let webView = self.webView {
                        self.updateNavigationState(webView: webView)
                    }
                }
            }
        }
        
        // ナビゲーション状態を更新
        func updateNavigationState(webView: WKWebView) {
            DispatchQueue.main.async {
                self.parent.canGoBack?.wrappedValue = webView.canGoBack
                self.parent.canGoForward?.wrappedValue = webView.canGoForward
            }
        }
        
        // WebViewの参照を更新
        func setWebView(_ webView: WKWebView) {
            self.webView = webView
        }
        
        // 読み込み中かどうかを確認
        func isLoading() -> Bool {
            return isLoadingInternal
        }
        
        // 広告関連のリクエストをブロック
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }
            
            let urlString = url.absoluteString.lowercased()
            
            // 広告関連のURLをブロック
            for pattern in adBlockPatterns {
                if urlString.contains(pattern.lowercased()) {
                    decisionHandler(.cancel)
                    return
                }
            }
            
            decisionHandler(.allow)
        }
        
        // リソース読み込み時のブロック
        func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
            guard let url = navigationResponse.response.url else {
                decisionHandler(.allow)
                return
            }
            
            let urlString = url.absoluteString.lowercased()
            
            // 広告関連のURLをブロック
            for pattern in adBlockPatterns {
                if urlString.contains(pattern.lowercased()) {
                    decisionHandler(.cancel)
                    return
                }
            }
            
            decisionHandler(.allow)
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            // 読み込み開始
            isLoadingInternal = true
            // プロビジョナルナビゲーション開始時は、まだURLが確定していないので
            // isInternalNavigationフラグはリセットしない（didFinishで判定）
            DispatchQueue.main.async {
                self.parent.isLoading?.wrappedValue = true
                // 読み込み開始時に、すべてのトリガーをリセット
                // これにより、読み込み中の操作による不具合を防ぐ
                self.parent.goBackTrigger?.wrappedValue = false
                self.parent.goForwardTrigger?.wrappedValue = false
                self.parent.reloadTrigger?.wrappedValue = false
            }
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // ここでは isLoading を false にしない！
            // ページが「表示」された後、JSの実行完了を待つ
            
            // ページ読み込み完了後に広告削除を補助的に実行
            // メインのスクリプトは既に.atDocumentStartで注入されているので、ここでは念のため再実行
            let removeAdsScript = """
            (function() {
                // シンプルに広告要素を削除
                const adSelectors = [
                    '[id^="google_ads_iframe_"]',
                    'iframe[title*="広告"]',
                    'iframe[aria-label*="広告"]',
                    '#geniee_overlay_outer',
                    '#geniee_overlay_inner',
                    '#gn_interstitial_outer_area',
                    '.gn_interstitial_outer_area',
                    '[id^="yads"]',
                    '[class*="yads_ad"]',
                    '#move-page-top',
                    'a[href="#musical-score-header"]',
                    '.ad-content-inter',
                    '.fc-dialog-overlay',
                    '.fc-monetization-dialog',
                    '#full-screen-ad',
                    '[id*="google_ads"]',
                    '[class*="videoAdUi"]'
                ];
                adSelectors.forEach(selector => {
                    try {
                        document.querySelectorAll(selector).forEach(el => el.remove());
                    } catch(e) {}
                });
                
                // UIの更新が完全に終わるまで待ってから通知を送る
                setTimeout(() => {
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.adBlockFinished) {
                        window.webkit.messageHandlers.adBlockFinished.postMessage(true);
                    }
                }, 500); // 500ms待ってから通知（UI更新の完了を待つ）
            })();
            """
            
            // JavaScriptを実行（完了通知はJS側から送られる）
            webView.evaluateJavaScript(removeAdsScript) { [weak self] (result, error) in
                guard let self = self else { return }
                
                // URL更新処理のみ実行（isLoadingはJSからの通知で更新される）
                DispatchQueue.main.async {
                    if let newURL = webView.url?.absoluteString {
                        let webViewURL = newURL.standardizedURLString
                        let currentBindingURL = self.parent.urlString.standardizedURLString
                        
                        // WebView内のURLがBindingと実質的に異なる場合（内部遷移）のみBindingを更新
                        if webViewURL != currentBindingURL && !webViewURL.isEmpty {
                            self.isInternalNavigation = true
                            self.parent.urlString = newURL
                            self.lastLoadedURL = newURL
                            
                            // SwiftUI側に値が浸透するまで待ってからフラグを戻す
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                self.isInternalNavigation = false
                            }
                        }
                    }
                    
                    self.updateNavigationState(webView: webView)
                }
            }
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            // エラーが広告関連のサブフレーム（iframe）の場合は無視
            // WebKitErrorDomain code=102は、フレームの読み込みが中断されたことを示す
            // 広告ブロッカーとして、広告iframeの読み込み失敗は正常な動作
            let nsError = error as NSError
            if nsError.domain == "WebKitErrorDomain" && nsError.code == 102 {
                // サブフレーム（広告iframe）のエラーは無視
                return
            }
            
            // メインフレームのエラーのみ処理
            isLoadingInternal = false
            DispatchQueue.main.async {
                self.parent.isLoading?.wrappedValue = false
                // エラー時もすべてのトリガーをリセット（確実にブロック解除）
                self.parent.goBackTrigger?.wrappedValue = false
                self.parent.goForwardTrigger?.wrappedValue = false
                self.parent.reloadTrigger?.wrappedValue = false
                // 内部遷移フラグもリセット
                self.isInternalNavigation = false
            }
        }
        
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            // エラーが広告関連のサブフレーム（iframe）の場合は無視
            // WebKitErrorDomain code=102は、フレームの読み込みが中断されたことを示す
            // 広告ブロッカーとして、広告iframeの読み込み失敗は正常な動作
            let nsError = error as NSError
            
            // NSURLErrorCancelled (-999) も広告ブロックによる正常な動作として無視
            if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
                // リクエストキャンセルは広告ブロックによる正常な動作
                return
            }
            
            // WebKitErrorDomain code=102（フレーム読み込み中断）も無視
            if nsError.domain == "WebKitErrorDomain" && nsError.code == 102 {
                // サブフレーム（広告iframe）のエラーは無視
                return
            }
            
            // メインフレームのエラーのみ処理
            isLoadingInternal = false
            DispatchQueue.main.async {
                self.parent.isLoading?.wrappedValue = false
                // エラー時もすべてのトリガーをリセット（確実にブロック解除）
                self.parent.goBackTrigger?.wrappedValue = false
                self.parent.goForwardTrigger?.wrappedValue = false
                self.parent.reloadTrigger?.wrappedValue = false
                // 内部遷移フラグもリセット
                self.isInternalNavigation = false
            }
        }
    }
}

// URL比較を正確にするための拡張（ヘルパー）
extension String {
    var standardizedURLString: String {
        var normalized = self.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        // 末尾の/を削除
        if normalized.hasSuffix("/") && normalized.count > 1 {
            normalized = String(normalized.dropLast())
        }
        // httpとhttpsの違いを無視
        normalized = normalized.replacingOccurrences(of: "http://", with: "https://")
        return normalized
    }
}

