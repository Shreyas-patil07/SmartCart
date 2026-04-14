import barcode
from barcode.writer import ImageWriter
import os
import random
from fpdf import FPDF

# Directory where barcodes will be saved
OUTPUT_DIR = "barcodes"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_barcodes(count=40):
    """
    Generates Code128 barcode images (PNG) and saves them in the output directory.
    We use Code128 because it supports alphanumeric characters like 'SMC...bar'.
    Then, it compiles all generated barcodes into a single PDF.
    """
    print(f"Generating {count} Code128 barcodes...")
    
    pdf = FPDF()
    # A4 is default. We'll add 1 barcode per page for simplicity.
    
    # Improved barcode generation options for better scanning
    barcode_options = {
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

    for i in range(1, count + 1):
        # Using the SMC prefix you requested
        random_suffix = "".join([str(random.randint(0, 9)) for _ in range(7)])
        value = f"SMC{random_suffix}" 

        # Generate barcode using code128 (supports letters and numbers)
        code = barcode.get("code128", value, writer=ImageWriter())

        # Save png file with improved options
        filename = os.path.join(OUTPUT_DIR, value)
        saved_path = code.save(filename, options=barcode_options)
        
        print(f"[{i}/{count}] Generated: {saved_path}")

        # Add image to PDF
        pdf.add_page()
        # x an y position, w=width
        pdf.image(saved_path, x=30, y=50, w=150)

    # Save the consolidated PDF
    pdf_path = "barcodes_collection.pdf"
    pdf.output(pdf_path)
    print(f"\nSuccessfully generated {count} barcodes in '{OUTPUT_DIR}' folder.")
    print(f"PDF generated successfully: {pdf_path}")

if __name__ == "__main__":
    generate_barcodes(40)
