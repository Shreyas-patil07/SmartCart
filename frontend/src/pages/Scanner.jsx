import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { scanBarcode } from '../lib/api.js'
import { useCart } from '../context/CartContext'
import { useSessionTimer } from '../hooks/useSessionTimer'
import Logo from '../components/Logo.jsx'
import Toast from '../components/Toast.jsx'
import SessionTimerBadge from '../components/SessionTimerBadge.jsx'
import { DEFAULT_STORE_ID, getStoreById } from '../lib/stores.js'

// ── Quagga removed — Html5Qrcode handles both live camera AND image file scanning ──

const MAX_CART = 2000
const SUPPORTED_FORMATS = [12] // 12 = CODE_128
const SCAN_COOLDOWN_MS = 2000

function normalizeDecodedBarcode(rawValue) {
  const cleanedValue = rawValue
    .toUpperCase()
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, '')

  if (!cleanedValue) return ''

  const smcMatch = cleanedValue.match(/SMC\d{7}/)
  if (smcMatch) return smcMatch[0]

  const numericMatch = cleanedValue.match(/\d{8,14}/)
  if (numericMatch) return numericMatch[0]

  return cleanedValue
}

export default function Scanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addItemByBarcode, subtotal, itemCount } = useCart()
  const { formatted, isExpiring } = useSessionTimer()
  const [toast, setToast] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [activeStore, setActiveStore] = useState(() => getStoreById(DEFAULT_STORE_ID))
  const [isPageVisible, setIsPageVisible] = useState(() => document.visibilityState === 'visible')
  const [imagePreview, setImagePreview] = useState(null)
  const [isDecodingImage, setIsDecodingImage] = useState(false)

  // Two separate refs: one for "Take Photo" (camera capture), one for "Upload from Gallery"
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const scannerRef = useRef(null)
  // A separate disposable Html5Qrcode instance used only for file/image scanning
  const imageScannerRef = useRef(null)

  const isProcessingRef = useRef(false)
  const lastScannedRef = useRef(null)
  const scanTimeoutRef = useRef(null)
  const readerDivId = 'barcode-reader'
  const isScannerPage = location.pathname.startsWith('/scan')
  const activeStoreId = activeStore?.id || DEFAULT_STORE_ID

  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    const savedStoreId = localStorage.getItem('selectedStoreId') || DEFAULT_STORE_ID
    const store = getStoreById(savedStoreId) || getStoreById(DEFAULT_STORE_ID)
    setActiveStore(store)
  }, [])

  useEffect(() => {
    function onVisibilityChange() {
      setIsPageVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // ── Live camera scanning with Html5Qrcode ──
  useEffect(() => {
    let isActive = true
    let isInitializing = false

    async function stopScanner() {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
        scanTimeoutRef.current = null
      }
      isProcessingRef.current = false
      if (scannerRef.current) {
        try {
          const state = await scannerRef.current.getState()
          if (state === 2) {
            await scannerRef.current.stop()
            console.log('Scanner stopped')
          }
        } catch (err) {
          console.debug('Stop scanner error:', err)
        }
      }
    }

    if (!isScannerPage || !isPageVisible) {
      setCameraReady(false)
      setIsScanning(false)
      setDebugInfo(!isPageVisible ? 'Camera paused (tab hidden)' : 'Open scanner page to activate camera')
      void stopScanner()
      return () => { isActive = false }
    }

    async function initScanner() {
      if (isInitializing) return
      isInitializing = true

      try {
        console.log('Initializing Html5Qrcode scanner...')
        setDebugInfo('Initializing scanner...')
        setCameraError(false)
        setCameraReady(false)

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(readerDivId)
        } else {
          try {
            const state = await scannerRef.current.getState()
            if (state === 2) {
              setCameraReady(true)
              setDebugInfo('Scanner active - point at barcode')
              isInitializing = false
              return
            }
          } catch (err) {
            console.debug('Get state error:', err)
          }
        }

        const config = {
          fps: 10,
          qrbox: { width: 350, height: 200 },
          formatsToSupport: SUPPORTED_FORMATS,
          disableFlip: false,
        }

        setDebugInfo('Starting camera...')

        await scannerRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText, decodedResult) => {
            if (isActive) {
              const normalizedBarcode = normalizeDecodedBarcode(decodedText)
              if (!normalizedBarcode) return
              const formatName = decodedResult?.result?.format?.formatName || 'CODE_128'
              console.log('✓ Barcode detected:', normalizedBarcode, formatName)
              setDebugInfo(`Detected ${formatName}: ${normalizedBarcode}`)
              handleBarcodeDetected(normalizedBarcode)
            }
          },
          (errorMessage) => {
            if (
              !errorMessage.includes('No MultiFormat Readers') &&
              !errorMessage.includes('NotFoundException') &&
              !errorMessage.toLowerCase().includes('no barcode')
            ) {
              console.debug('Scan error:', errorMessage)
            }
          }
        )

        if (!isActive || !isScannerPage || !isPageVisible) {
          await stopScanner()
          isInitializing = false
          return
        }

        console.log('Scanner active - ready to scan Code128 barcodes')
        setDebugInfo('Scanner active - point at barcode')
        setCameraReady(true)
        isInitializing = false
      } catch (err) {
        console.error('Scanner initialization error:', err)
        setDebugInfo('Scanner error: ' + (err?.message || err?.toString() || 'Unknown error'))
        setCameraError(true)
        isInitializing = false
      }
    }

    function handleBarcodeDetected(barcode) {
      if (isProcessingRef.current) return
      if (lastScannedRef.current === barcode) return

      isProcessingRef.current = true
      lastScannedRef.current = barcode
      setIsScanning(true)
      setToast(null)

      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)

      ;(async () => {
        try {
          await scanBarcode({ barcode, storeId: activeStoreId })
          const added = addItemByBarcode(barcode)
          setToast({ type: 'success', msg: `${added.name} added to cart!` })
        } catch {
          try {
            const added = addItemByBarcode(barcode)
            setToast({ type: 'success', msg: `${added.name} added to cart!` })
          } catch {
            setToast({ type: 'error', msg: 'Product not found' })
          }
        } finally {
          isProcessingRef.current = false
          setIsScanning(false)
          scanTimeoutRef.current = setTimeout(() => {
            lastScannedRef.current = null
            setDebugInfo('Scanner active - point at barcode')
          }, SCAN_COOLDOWN_MS)
        }
      })()
    }

    const initTimeout = setTimeout(() => { if (isActive) initScanner() }, 100)

    return () => {
      isActive = false
      clearTimeout(initTimeout)
      void stopScanner()
    }
  }, [addItemByBarcode, activeStoreId, isPageVisible, isScannerPage])

  // ── Shared image decode logic (used by both camera-capture and gallery-upload) ──
  const decodeImageFile = useCallback(async (file) => {
    if (!file) return

    console.log('Decoding image:', file.name, file.type)

    // Show preview
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result
      if (typeof imageDataUrl !== 'string') return

      setImagePreview(imageDataUrl)
      setIsDecodingImage(true)
      setToast(null)
      setDebugInfo('Decoding image...')

      try {
        // Re-use or create a disposable Html5Qrcode instance for file scanning.
        // NOTE: Html5Qrcode.scanFile() does NOT need a mounted DOM element —
        // the id below is only used internally for a hidden canvas.
        const imageScanDivId = 'image-scan-worker'
        if (!imageScannerRef.current) {
          imageScannerRef.current = new Html5Qrcode(imageScanDivId)
        }

        // scanFile returns a promise with the decoded text
        const decodedText = await imageScannerRef.current.scanFile(file, /* showImage */ false)
        const normalized = normalizeDecodedBarcode(decodedText)

        if (normalized) {
          console.log('✓ Image decode success:', normalized)
          setDebugInfo(`✓ Detected: ${normalized}`)
          setImagePreview(null)

          try {
            await scanBarcode({ barcode: normalized, storeId: activeStoreId })
            const added = addItemByBarcode(normalized)
            setToast({ type: 'success', msg: `${added.name} added to cart!` })
          } catch {
            try {
              const added = addItemByBarcode(normalized)
              setToast({ type: 'success', msg: `${added.name} added to cart!` })
            } catch {
              setToast({ type: 'error', msg: 'Product not found' })
            }
          }
        } else {
          setDebugInfo('✗ Invalid barcode format')
          setToast({ type: 'error', msg: 'Invalid barcode format' })
        }
      } catch (err) {
        console.error('Image decode error:', err)
        setDebugInfo('✗ No barcode detected in image')
        setToast({ type: 'error', msg: 'No barcode detected in image' })
      } finally {
        setIsDecodingImage(false)
        setTimeout(() => setImagePreview(null), 2000)
      }
    }

    reader.onerror = () => {
      setDebugInfo('✗ Failed to read image')
      setToast({ type: 'error', msg: 'Failed to read image' })
      setIsDecodingImage(false)
      setImagePreview(null)
    }

    reader.readAsDataURL(file)
  }, [addItemByBarcode, activeStoreId])

  // Triggered by "Take Photo" button — opens device camera
  const handleCameraCapture = useCallback((e) => {
    const file = e.target.files?.[0]
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    decodeImageFile(file)
  }, [decodeImageFile])

  // Triggered by "Upload Image" button — opens photo gallery / file picker
  const handleGalleryUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    decodeImageFile(file)
  }, [decodeImageFile])

  const handleRetakeImage = useCallback(() => {
    setImagePreview(null)
    setIsDecodingImage(false)
    setDebugInfo('Scanner active - point at barcode')
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }, [])

  const handleSimulateScan = useCallback(async () => {
    setToast(null)
    try {
      await scanBarcode({ barcode: '8901234567890', storeId: activeStoreId })
      const added = addItemByBarcode('8901234567890')
      setToast({ type: 'success', msg: `${added.name} added to cart!` })
    } catch {
      const added = addItemByBarcode('8901234567890')
      setToast({ type: 'success', msg: `${added.name} added to cart!` })
    }
  }, [addItemByBarcode, activeStoreId])

  const progress = Math.min((subtotal / MAX_CART) * 100, 100)
  const scannerStateLabel = !isPageVisible
    ? 'Camera paused'
    : isScanning
      ? 'Reading barcode...'
      : cameraReady
        ? 'Scanner ready'
        : 'Starting camera...'
  const scannerStateDot = isScanning
    ? 'bg-tertiary animate-pulse'
    : cameraReady
      ? 'bg-emerald-400 animate-pulse'
      : 'bg-white/60'
  const helperLabel = !isPageVisible
    ? 'Return to this tab to resume scanning.'
    : cameraError
      ? 'Camera access failed. Upload an image or use simulated scan.'
      : 'Keep the Code128 barcode horizontal and fully visible for faster detection.'

  return (
    <div className="bg-black min-h-dvh flex flex-col overflow-hidden relative">
      {/* ── Top App Bar ── */}
      <header className="bg-surface/90 backdrop-blur-md relative z-50">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-md mx-auto">
          <Logo to="/" />
          <SessionTimerBadge formatted={formatted} isExpiring={isExpiring} />
        </div>
      </header>

      {/* ── Toast ── */}
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Hidden div required by Html5Qrcode for image scanning (never visible) */}
      <div id="image-scan-worker" style={{ display: 'none' }} aria-hidden="true" />

      {/* ── Camera View ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* Html5Qrcode live camera container */}
        <div
          id={readerDivId}
          className="absolute inset-0 w-full h-full"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60 pointer-events-none z-10" />

        {/* Fallback static image when camera is unavailable */}
        {cameraError && (
          <img
            src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80"
            alt="Store aisle view"
            className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale-[15%]"
            aria-hidden="true"
          />
        )}

        {/* Camera loading state */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white/70 text-sm font-medium">Starting camera…</p>
            </div>
          </div>
        )}

        {/* Hide html5-qrcode default UI elements */}
        <style>{`
          #${readerDivId} {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          #${readerDivId} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          #${readerDivId}__scan_region {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            border: none !important;
          }
          #${readerDivId}__dashboard_section,
          #${readerDivId}__dashboard_section_csr {
            display: none !important;
          }
        `}</style>

        {/* Camera denied pill */}
        {cameraError && (
          <div className="absolute top-3 left-0 right-0 flex justify-center px-6 pointer-events-none z-20">
            <div className="bg-error/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <p className="text-white font-semibold text-[11px] tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">videocam_off</span>
                Camera unavailable — image mode
              </p>
            </div>
          </div>
        )}

        {/* Store context pill */}
        <div
          className="absolute left-0 right-0 flex justify-center px-6 pointer-events-none z-30"
          style={{ top: cameraError ? '3rem' : '0.75rem' }}
        >
          <div className="bg-black/45 backdrop-blur-xl px-4 py-2 rounded-full border border-white/15 shadow-lg">
            <p className="text-white font-semibold text-xs tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">storefront</span>
              {activeStore?.name || 'City Supermarket Downtown'}
            </p>
          </div>
        </div>

        {/* Debug info */}
        {debugInfo && (
          <div className="absolute bottom-28 left-3 right-3 z-30">
            <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20">
              <p className="text-white text-xs font-mono">{debugInfo}</p>
            </div>
          </div>
        )}

        {/* Image preview overlay */}
        {imagePreview && (
          <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center p-4">
            <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
              <img
                src={imagePreview}
                alt="Barcode image preview"
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            {isDecodingImage && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm font-medium">Decoding barcode…</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleRetakeImage}
                disabled={isDecodingImage}
                className="h-11 px-6 bg-error text-on-error rounded-xl shadow-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined">refresh</span>
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Focus halo */}
        {!imagePreview && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div
              className={`
                relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border transition-all duration-300
                ${isScanning
                  ? 'border-tertiary/70 shadow-[0_0_80px_rgba(255,193,7,0.30)] scale-105'
                  : 'border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.12)]'
                }
              `}
            >
              <div className="absolute inset-6 rounded-full border border-white/20" />
              <div
                className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                  isScanning ? 'bg-tertiary' : 'bg-white/70'
                }`}
              />
            </div>
          </div>
        )}

        {/* ── Status + Action Card ── */}
        <div className="absolute bottom-6 left-0 right-0 px-4 z-30">
          <div className="max-w-md mx-auto bg-black/55 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl">
            {/* Scanner state row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${scannerStateDot}`} />
                <p className="text-white text-sm font-semibold truncate">{scannerStateLabel}</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold">Live</span>
            </div>

            <p className="text-white/75 text-xs mt-1.5">{helperLabel}</p>

            {/* Action buttons row */}
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              {/* Cart count pill */}
              <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-primary-fixed text-xs">inventory_2</span>
                <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* ── Take Photo (camera capture) ── */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isDecodingImage}
                  aria-label="Take a photo of barcode"
                  className="h-10 px-3 bg-secondary text-on-secondary rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.03] active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">
                    {isDecodingImage ? 'hourglass_top' : 'photo_camera'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide">Photo</span>
                </button>
                {/* Opens device camera only */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                  aria-label="Take photo of barcode"
                />

                {/* ── Upload from Gallery ── */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isDecodingImage}
                  aria-label="Upload barcode image from gallery"
                  className="h-10 px-3 bg-tertiary-container text-on-tertiary-container rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.03] active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">
                    {isDecodingImage ? 'hourglass_top' : 'image_search'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide">Gallery</span>
                </button>
                {/* No capture attribute → opens file/gallery picker */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                  aria-label="Upload barcode image from gallery"
                />

                {/* ── Simulate scan (debug fallback) ── */}
                {cameraError && (
                  <button
                    onClick={handleSimulateScan}
                    aria-label="Simulate barcode scan"
                    className="h-10 px-4 bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.03] active:scale-[0.97] transition-transform"
                  >
                    <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                    <span className="text-xs font-bold uppercase tracking-wide">Simulate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Cart Preview ── */}
      <section className="bg-white/85 backdrop-blur-xl rounded-t-3xl border-t border-surface-container shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-20">
        <div className="max-w-md mx-auto px-5 pt-3 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative bg-secondary-container p-2.5 rounded-xl">
                <span className="material-symbols-outlined text-secondary text-xl">shopping_cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-on-surface-variant text-[9px] font-bold uppercase tracking-tight">Current Total</p>
                <p className="text-xl font-black text-on-surface tracking-tighter">
                  ₹{subtotal.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-[9px] font-bold uppercase">Cart Limit</p>
              <div className="w-20 h-1.5 bg-surface-container rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/cart')}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-base rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            View Cart
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  )
}