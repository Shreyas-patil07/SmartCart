"""
Test script to verify barcode generation and readability
"""
import barcode
from barcode.writer import ImageWriter
from PIL import Image
import os

def test_barcode_generation():
    """Generate a test barcode with optimal settings for scanning"""
    
    test_value = "SMC1234567"
    output_dir = "test_output"
    os.makedirs(output_dir, exist_ok=True)
    
    # Create Code128 barcode with custom options for better scanning
    code128 = barcode.get('code128', test_value, writer=ImageWriter())
    
    # Configure writer options for better quality
    options = {
        'module_width': 0.4,  # Width of narrowest bar (mm) - increased for better scanning
        'module_height': 15.0,  # Height of bars (mm)
        'quiet_zone': 6.5,  # Quiet zone (mm) - white space around barcode
        'font_size': 10,  # Font size for text below barcode
        'text_distance': 5.0,  # Distance between barcode and text
        'background': 'white',
        'foreground': 'black',
        'write_text': True,  # Include human-readable text
        'dpi': 300,  # High DPI for better quality
    }
    
    filename = os.path.join(output_dir, test_value)
    saved_path = code128.save(filename, options=options)
    
    print(f"✓ Test barcode generated: {saved_path}")
    print(f"  Value: {test_value}")
    print(f"  Format: Code128")
    
    # Check image properties
    img = Image.open(saved_path)
    print(f"  Image size: {img.size[0]}x{img.size[1]} pixels")
    print(f"  Image mode: {img.mode}")
    
    return saved_path

def generate_improved_barcodes(count=40):
    """Generate barcodes with improved settings for scanning"""
    import random
    from fpdf import FPDF
    
    output_dir = "barcodes_improved"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating {count} improved Code128 barcodes...")
    
    pdf = FPDF()
    
    # Improved writer options
    options = {
        'module_width': 0.4,
        'module_height': 15.0,
        'quiet_zone': 6.5,
        'font_size': 10,
        'text_distance': 5.0,
        'background': 'white',
        'foreground': 'black',
        'write_text': True,
        'dpi': 300,
    }
    
    for i in range(1, count + 1):
        random_suffix = "".join([str(random.randint(0, 9)) for _ in range(7)])
        value = f"SMC{random_suffix}"
        
        code = barcode.get("code128", value, writer=ImageWriter())
        filename = os.path.join(output_dir, value)
        saved_path = code.save(filename, options=options)
        
        print(f"[{i}/{count}] Generated: {saved_path}")
        
        pdf.add_page()
        pdf.image(saved_path, x=30, y=50, w=150)
    
    pdf_path = os.path.join(output_dir, "barcodes_collection.pdf")
    pdf.output(pdf_path)
    print(f"\n✓ Successfully generated {count} improved barcodes")
    print(f"✓ PDF: {pdf_path}")

if __name__ == "__main__":
    print("=" * 60)
    print("BARCODE GENERATION TEST")
    print("=" * 60)
    
    # Test single barcode
    print("\n1. Testing single barcode generation...")
    test_barcode_generation()
    
    # Generate improved batch
    print("\n2. Generating improved barcode batch...")
    response = input("\nGenerate 40 improved barcodes? (y/n): ")
    if response.lower() == 'y':
        generate_improved_barcodes(40)
    
    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)
