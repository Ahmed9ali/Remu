package com.example

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
        var isWebViewLoaded by remember { mutableStateOf(false) }

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
            onWebViewReady = { webViewInstance = it },
            onPageFinished = { isWebViewLoaded = true }
          )

          AnimatedVisibility(
            visible = !isWebViewLoaded,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
          ) {
            Box(
              modifier = Modifier
                .fillMaxSize()
                .background(androidx.compose.ui.graphics.Color.Black),
              contentAlignment = Alignment.Center
            ) {
              Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(
                  color = androidx.compose.ui.graphics.Color(0xFF38BDF8),
                  modifier = Modifier.size(36.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                  text = "Starting Termux Code...",
                  color = androidx.compose.ui.graphics.Color(0xFF94A3B8),
                  fontSize = 13.sp
                )
              }
            }
          }
        }
      }
    }
  }

  @Composable
  fun TermuxCodeWebView(
    modifier: Modifier = Modifier,
    onWebViewReady: (WebView) -> Unit,
    onPageFinished: () -> Unit
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
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
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
              val loaderResponse = assetLoader.shouldInterceptRequest(request.url)
              if (loaderResponse != null) {
                // Ensure CORS headers for modern ES modules
                loaderResponse.responseHeaders = (loaderResponse.responseHeaders ?: mutableMapOf()).apply {
                  put("Access-Control-Allow-Origin", "*")
                }
                return loaderResponse
              }

              // Fallback interceptor to ensure zero asset loading failures
              val path = request.url.path ?: return null
              val relativePath = when {
                path.startsWith("/assets/") -> path.removePrefix("/assets/")
                path.startsWith("/web/") -> path.removePrefix("/")
                else -> "web" + (if (path.startsWith("/")) path else "/$path")
              }

              return try {
                val inputStream = ctx.assets.open(relativePath)
                val mimeType = when {
                  relativePath.endsWith(".html") -> "text/html"
                  relativePath.endsWith(".js") -> "application/javascript"
                  relativePath.endsWith(".css") -> "text/css"
                  relativePath.endsWith(".json") -> "application/json"
                  relativePath.endsWith(".svg") -> "image/svg+xml"
                  relativePath.endsWith(".png") -> "image/png"
                  relativePath.endsWith(".wasm") -> "application/wasm"
                  else -> "application/octet-stream"
                }
                val headers = mutableMapOf("Access-Control-Allow-Origin" to "*")
                WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, inputStream)
              } catch (_: Exception) {
                null
              }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
              super.onPageFinished(view, url)
              onPageFinished()
            }

            override fun onReceivedError(
              view: WebView?,
              request: WebResourceRequest?,
              error: WebResourceError?
            ) {
              super.onReceivedError(view, request, error)
              Log.e("TermuxCode", "WebView Error: ${error?.errorCode} ${error?.description}")
            }
          }

          webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
              Log.d("TermuxCodeJS", "${consoleMessage?.message()} [${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()}]")
              return true
            }
          }

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
