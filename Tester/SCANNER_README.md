# Barcode Scanner - Python Testing Tool

A Python script to test Code128 barcode detection from camera and images.

## Installation

1. Install required dependencies:
```bash
pip install -r requirements_scanner.txt
```

### Additional Setup (Windows)

For pyzbar to work on Windows, you need to install the zbar DLL:

1. Download zbar from: http://zbar.sourceforge.net/download.html
2. Or install via: `pip install pyzbar[scripts]`
3. Or download pre-built DLL and add to PATH

### Additional Setup (Linux)

```bash
sudo apt-get install libzbar0
```

### Additional Setup (macOS)

```bash
brew install zbar
```

## Usage

### 1. Scan from Live Camera

```bash
python barcode_scanner.py --camera
```

**Controls:**
- Point camera at barcode
- Press `q` to quit
- Press `s` to save current frame

### 2. Scan from Image File

```bash
python barcode_scanner.py --image barcodes/SMC1234567.png
```

### 3. Scan All Images in Directory

```bash
python barcode_scanner.py --directory barcodes
```

This will scan all PNG, JPG, JPEG, BMP, TIFF, and GIF files in the directory.

## Examples

### Test a single barcode image
```bash
python barcode_scanner.py --image barcodes/SMC0468349.png
```

### Test all generated barcodes
```bash
python barcode_scanner.py --directory barcodes
```

### Live camera testing
```bash
python barcode_scanner.py --camera
```

## Features

- ✓ Detects Code128 barcodes (and other formats)
- ✓ Live camera scanning with visual feedback
- ✓ Image file scanning
- ✓ Batch directory scanning
- ✓ Visual bounding boxes around detected barcodes
- ✓ Real-time display of barcode data
- ✓ Frame capture capability

## Troubleshooting

### Camera not opening
- Check if another application is using the camera
- Try changing camera index in code (0, 1, 2, etc.)
- Ensure camera permissions are granted

### No barcodes detected
- Ensure good lighting
- Hold barcode steady and in focus
- Try different distances (15-30cm usually works best)
- Make sure barcode is not too small in frame
- Verify barcode image quality

### pyzbar import error
- Install zbar library (see Installation section)
- On Windows, ensure zbar DLL is in PATH

## Output

The scanner will display:
- Barcode type (e.g., CODE128)
- Barcode data (e.g., SMC1234567)
- Position in image (x, y, width, height)
- Visual overlay on image/video

## Testing Your Generated Barcodes

After generating barcodes with `barcode_generator.py`, test them:

```bash
# Test all generated barcodes
python barcode_scanner.py --directory barcodes

# Test specific barcode
python barcode_scanner.py --image barcodes/SMC1234567.png

# Test with camera (print barcode or display on screen)
python barcode_scanner.py --camera
```

This helps verify that your generated barcodes are scannable before testing with the web application.
