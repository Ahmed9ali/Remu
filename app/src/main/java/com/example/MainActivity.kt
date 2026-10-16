package com.example

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

  var isEditorOpen by mutableStateOf(false)
  private var webViewInstance: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      MyApplicationTheme {
        BackHandler(enabled = true) {
          if (isEditorOpen) {
            webViewInstance?.evaluateJavascript(
              "window.dispatchEvent(new CustomEvent('android-back'))",
              null
            )
          } else {
            finish()
          }
        }

        Box(
          modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.ui.graphics.Color.Black)
            .statusBarsPadding()
            .imePadding()
        ) {
          TermuxCodeWebView(
            modifier = Modifier.fillMaxSize(),
            onWebViewReady = { webViewInstance = it }
          )
        }
      }
    }
  }

  @Composable
  fun TermuxCodeWebView(
    modifier: Modifier = Modifier,
    onWebViewReady: (WebView) -> Unit
  ) {
    AndroidView(
      modifier = modifier,
      factory = { ctx ->
        WebView(ctx).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )
          setBackgroundColor(Color.BLACK)

          settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            textZoom = 100
          }

          val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(ctx))
            .build()

          webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
              view: WebView,
              request: WebResourceRequest
            ): WebResourceResponse? {
              return assetLoader.shouldInterceptRequest(request.url)
            }
          }

          webChromeClient = WebChromeClient()

          addJavascriptInterface(AndroidBridge(this@MainActivity, this), "AndroidBridge")

          loadUrl("https://appassets.androidplatform.net/assets/web/index.html")
          onWebViewReady(this)
        }
      }
    )
  }

  class AndroidBridge(
    private val activity: MainActivity,
    private val webView: WebView
  ) {
    @JavascriptInterface
    fun vibrate(durationMs: Long) {
      activity.runOnUiThread {
        val vibrator = activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        vibrator?.let {
          val safeMs = durationMs.coerceIn(5, 500)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            it.vibrate(
              VibrationEffect.createOneShot(safeMs, VibrationEffect.DEFAULT_AMPLITUDE)
            )
          } else {
            @Suppress("DEPRECATION")
            it.vibrate(safeMs)
          }
        }
      }
    }

    @JavascriptInterface
    fun getGeminiApiKey(): String {
      return try {
        BuildConfig.GEMINI_API_KEY
      } catch (_: Exception) {
        ""
      }
    }

    @JavascriptInterface
    fun onEditorStateChange(isOpen: Boolean) {
      activity.runOnUiThread {
        activity.isEditorOpen = isOpen
      }
    }

    @JavascriptInterface
    fun downloadFile(filename: String, content: String) {
      activity.runOnUiThread {
        val sendIntent = Intent().apply {
          action = Intent.ACTION_SEND
          putExtra(Intent.EXTRA_TEXT, content)
          putExtra(Intent.EXTRA_TITLE, filename)
          type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, "Share or Save $filename")
        activity.startActivity(shareIntent)
      }
    }
  }
}
