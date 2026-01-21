//
//  ContentView.swift
//  Ufret_Ad_Blocker_iOS
//
//  Created by Yusuke Mizuno on 2026/01/21.
//

import SwiftUI

struct ContentView: View {
    @State private var urlString: String = "https://www.ufret.jp"
    @State private var inputText: String = "https://www.ufret.jp"
    @State private var canGoBack: Bool = false
    @State private var canGoForward: Bool = false
    @State private var isLoading: Bool = false
    @State private var goBackTrigger: Bool = false
    @State private var goForwardTrigger: Bool = false
    @State private var reloadTrigger: Bool = false
    
    var body: some View {
        VStack(spacing: 0) {
            // URLバーとナビゲーションコントロール
            VStack(spacing: 8) {
                HStack(spacing: 12) {
                    // 戻るボタン
                    Button(action: {
                        if !isLoading {
                            goBackTrigger.toggle()
                        }
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor((canGoBack && !isLoading) ? .blue : .gray)
                    }
                    .disabled(!canGoBack || isLoading)
                    
                    // 進むボタン
                    Button(action: {
                        if !isLoading {
                            goForwardTrigger.toggle()
                        }
                    }) {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor((canGoForward && !isLoading) ? .blue : .gray)
                    }
                    .disabled(!canGoForward || isLoading)
                    
                    // URL入力フィールド
                    HStack {
                        Image(systemName: isLoading ? "arrow.triangle.2.circlepath" : "lock.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                        
                        TextField("URLを入力", text: $inputText)
                            .textFieldStyle(.plain)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .keyboardType(.URL)
                            .disabled(isLoading)
                            .onSubmit {
                                if !isLoading {
                                    loadURL()
                                }
                            }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    
                    // リロードボタン
                    Button(action: {
                        if !isLoading {
                            reloadTrigger.toggle()
                        }
                    }) {
                        Image(systemName: isLoading ? "xmark" : "arrow.clockwise")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(isLoading ? .gray : .blue)
                    }
                    .disabled(isLoading)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                
                Divider()
            }
            
            // WebView
            ZStack {
                WebViewContainer(
                    urlString: $urlString,
                    canGoBack: $canGoBack,
                    canGoForward: $canGoForward,
                    isLoading: $isLoading,
                    goBackTrigger: $goBackTrigger,
                    goForwardTrigger: $goForwardTrigger,
                    reloadTrigger: $reloadTrigger
                )
                .onChange(of: urlString) { newValue in
                    // URLが変更されたら入力フィールドも更新
                    if inputText != newValue {
                        inputText = newValue
                    }
                }
                .onAppear {
                    loadURL()
                }
                
                // 読み込み中オーバーレイ
                if isLoading {
                    // 背景をより暗くする
                    Color.black.opacity(0.8)
                        .ignoresSafeArea()
                    
                    // 横に長い角張った長方形のUI
                    HStack(spacing: 16) {
                        // モダンなローディングアニメーション（左部）
                        ProgressView()
                            .scaleEffect(1.2)
                            .tint(.white)
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        
                        // Loadingテキスト
                        Text("Loading")
                            .foregroundColor(.white)
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .frame(width: 180, height: 50)
                    .background(Color.black.opacity(0.95))
                    .cornerRadius(4) // 角張ったデザイン
                    .shadow(color: .black.opacity(0.5), radius: 8, x: 0, y: 4)
                }
            }
        }
        .edgesIgnoringSafeArea(.bottom)
    }
    
    private func loadURL() {
        var urlToLoad = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // URLスキームがない場合はhttps://を追加
        if !urlToLoad.hasPrefix("http://") && !urlToLoad.hasPrefix("https://") {
            urlToLoad = "https://" + urlToLoad
        }
        
        // 有効なURLかチェック
        if URL(string: urlToLoad) != nil {
            urlString = urlToLoad
            inputText = urlToLoad
        }
    }
}

#Preview {
    ContentView()
}
