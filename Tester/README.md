# Barcode Generator Tool

This is an automated Python script designed to generate random alphanumeric Code128 barcodes and consolidate them into a single PDF document.

## 🚀 Overview

The main functionality is encapsulated in the `barcode_generator.py` script. It generates a specified number of unique product barcodes, saves each as a high-quality `.png` image, and then automatically compiles all the generated images into a structured PDF file for easy printing and distribution.

## 🛠️ Technology Stack
- **Python-Barcode**: Used for rendering standard `code128` barcodes.
- **FPDF**: A library used for generating the final comprehensive PDF document.
- **Pillow / ImageWriter**: Used as a fast image-saving bridge for the Python-barcode library.

## 📋 Prerequisites
Ensure you have Python installed, then install the required dependencies:
```bash
pip install python-barcode fpdf pillow
```

## 🔄 User Flow
1. **Execution**: The user runs the script from the terminal (`python barcode_generator.py`).
2. **Setup Phase**: The system creates a `barcodes/` directory automatically if it doesn't already exist to hold the generated assets.
3. **Generation Loop**: 
   - A unique identifier is generated using the prefix `"SMC"` followed by a random **7-digit number** (e.g., `SMC4829103`).
   - The string is encoded into a **Code128** visual barcode (chosen because it safely supports both letters and numbers).
   - The barcode is saved as a `.png` file inside the `barcodes/` directory.
   - A new page is added to an internal PDF tracking document, and the barcode image is stamped onto the page.
4. **Completion**: Once all 40 iterations (or the specified target amount) are complete, the entire PDF document is exported and saved locally as `barcodes_collection.pdf`.

## 💻 Code Workflow Explanation
### 1. **Imports & Setup**
```python
import barcode
from barcode.writer import ImageWriter
import os
import random
from fpdf import FPDF
```
The script pulls in random number generation utilities, filesystem handling hooks, and the main visual libraries (FDDF and Code128). An `OUTPUT_DIR` variable is defined and the directory is immediately created via `os.makedirs()`.

### 2. **`generate_barcodes(count)` Function**
- **PDF Initialization**: `pdf = FPDF()` spins up a blank, A4-sized PDF in memory.
- **Loop Architecture**: A standard `for` loop runs `count` (default 40) times.
- **ID Formation**: 
  ```python
  random_suffix = "".join([str(random.randint(0, 9)) for _ in range(7)])
  value = f"SMC{random_suffix}"
  ```
  Generates the random target value.
- **Encoding & Saving**:
  ```python
  code = barcode.get("code128", value, writer=ImageWriter())
  filename = os.path.join(OUTPUT_DIR, value)
  saved_path = code.save(filename)
  ```
  Translates the string into a graphical PNG file.
- **PDF Stacking**:
  ```python
  pdf.add_page()
  pdf.image(saved_path, x=30, y=50, w=150)
  ```
  Adds a blank page and stamps the `saved_path` (PNG image) onto the PDF.

### 3. **Final Output**
```python
pdf_path = "barcodes_collection.pdf"
pdf.output(pdf_path)
```
The file lock opens, writes out the generated PDF from dynamic memory to your hard drive, clears resources, and prints a success alert to the console.

## 📝 Customization
- **Barcode Format:** If you wish to use a different barcode format (like EAN-13), you can swap `"code128"` out for `"ean13"`. *Note that EAN-13 requires strictly 12 numeric digits without any string characters.*
- **Custom Amount**: Modify `generate_barcodes(40)` at the bottom of the script to change the quantity of barcodes generated.
