"""
Barcode Scanner - Detects Code128 barcodes from camera and images
Supports both live camera scanning and image file scanning
"""
import cv2
from pyzbar import pyzbar
import argparse
import os
from pathlib import Path


def decode_barcode(frame):
    """
    Decode barcodes from a frame/image
    Returns list of detected barcodes with their data and type
    """
    barcodes = pyzbar.decode(frame)
    results = []
    
    for barcode in barcodes:
        # Extract barcode data and type
        barcode_data = barcode.data.decode('utf-8')
        barcode_type = barcode.type
        
        # Get bounding box coordinates
        (x, y, w, h) = barcode.rect
        
        results.append({
            'data': barcode_data,
            'type': barcode_type,
            'rect': (x, y, w, h),
            'polygon': barcode.polygon
        })
    
    return results


def draw_barcode(frame, barcode_info):
    """Draw bounding box and text on frame for detected barcode"""
    x, y, w, h = barcode_info['rect']
    
    # Draw rectangle around barcode
    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    # Prepare text
    text = f"{barcode_info['type']}: {barcode_info['data']}"
    
    # Draw background for text
    (text_width, text_height), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    cv2.rectangle(frame, (x, y - text_height - 10), (x + text_width, y), (0, 255, 0), -1)
    
    # Draw text
    cv2.putText(frame, text, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    return frame


def scan_from_camera():
    """Scan barcodes from live camera feed"""
    print("=" * 60)
    print("LIVE CAMERA BARCODE SCANNER")
    print("=" * 60)
    print("Instructions:")
    print("  - Point camera at Code128 barcode")
    print("  - Press 'q' to quit")
    print("  - Press 's' to save current frame")
    print("=" * 60)
    
    # Initialize camera
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Could not open camera")
        return
    
    # Set camera resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    print("✓ Camera initialized")
    print("✓ Scanning for barcodes...")
    
    last_detected = None
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("❌ Error: Failed to read frame")
            break
        
        frame_count += 1
        
        # Decode barcodes from frame
        barcodes = decode_barcode(frame)
        
        # Process detected barcodes
        for barcode_info in barcodes:
            # Draw on frame
            frame = draw_barcode(frame, barcode_info)
            
            # Print detection (avoid spam by checking if different from last)
            if barcode_info['data'] != last_detected:
                print(f"\n✓ DETECTED:")
                print(f"  Type: {barcode_info['type']}")
                print(f"  Data: {barcode_info['data']}")
                print(f"  Position: {barcode_info['rect']}")
                last_detected = barcode_info['data']
        
        # Add status text to frame
        status_text = f"Frame: {frame_count} | Detected: {len(barcodes)}"
        cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Add instructions
        cv2.putText(frame, "Press 'q' to quit, 's' to save", (10, frame.shape[0] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Display frame
        cv2.imshow('Barcode Scanner - Live Camera', frame)
        
        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("\n✓ Quitting...")
            break
        elif key == ord('s'):
            # Save current frame
            filename = f"captured_frame_{frame_count}.png"
            cv2.imwrite(filename, frame)
            print(f"\n✓ Frame saved: {filename}")
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("✓ Camera released")


def scan_from_image(image_path):
    """Scan barcodes from an image file"""
    print("=" * 60)
    print("IMAGE BARCODE SCANNER")
    print("=" * 60)
    print(f"Image: {image_path}")
    print("=" * 60)
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"❌ Error: Image file not found: {image_path}")
        return
    
    # Read image
    image = cv2.imread(image_path)
    
    if image is None:
        print(f"❌ Error: Could not read image: {image_path}")
        return
    
    print(f"✓ Image loaded: {image.shape[1]}x{image.shape[0]} pixels")
    
    # Decode barcodes
    barcodes = decode_barcode(image)
    
    if len(barcodes) == 0:
        print("❌ No barcodes detected in image")
        print("\nTips:")
        print("  - Ensure barcode is clear and in focus")
        print("  - Try better lighting")
        print("  - Make sure barcode is not too small")
    else:
        print(f"\n✓ Found {len(barcodes)} barcode(s):")
        
        for i, barcode_info in enumerate(barcodes, 1):
            print(f"\n  Barcode #{i}:")
            print(f"    Type: {barcode_info['type']}")
            print(f"    Data: {barcode_info['data']}")
            print(f"    Position: {barcode_info['rect']}")
            
            # Draw on image
            image = draw_barcode(image, barcode_info)
    
    # Display image
    cv2.imshow('Barcode Scanner - Image', image)
    print("\n✓ Press any key to close the image window...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def scan_directory(directory_path):
    """Scan all images in a directory for barcodes"""
    print("=" * 60)
    print("DIRECTORY BARCODE SCANNER")
    print("=" * 60)
    print(f"Directory: {directory_path}")
    print("=" * 60)
    
    if not os.path.isdir(directory_path):
        print(f"❌ Error: Directory not found: {directory_path}")
        return
    
    # Supported image extensions
    image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif'}
    
    # Find all image files
    image_files = []
    for file in Path(directory_path).iterdir():
        if file.suffix.lower() in image_extensions:
            image_files.append(file)
    
    if not image_files:
        print("❌ No image files found in directory")
        return
    
    print(f"✓ Found {len(image_files)} image file(s)")
    print("\nScanning images...\n")
    
    results = []
    
    for image_file in image_files:
        print(f"Scanning: {image_file.name}...", end=" ")
        
        image = cv2.imread(str(image_file))
        if image is None:
            print("❌ Could not read")
            continue
        
        barcodes = decode_barcode(image)
        
        if barcodes:
            print(f"✓ Found {len(barcodes)} barcode(s)")
            for barcode_info in barcodes:
                results.append({
                    'file': image_file.name,
                    'type': barcode_info['type'],
                    'data': barcode_info['data']
                })
                print(f"  → {barcode_info['type']}: {barcode_info['data']}")
        else:
            print("❌ No barcodes")
    
    # Summary
    print("\n" + "=" * 60)
    print(f"SUMMARY: Found {len(results)} barcode(s) in {len(image_files)} image(s)")
    print("=" * 60)
    
    if results:
        print("\nAll detected barcodes:")
        for result in results:
            print(f"  {result['file']}: {result['data']} ({result['type']})")


def main():
    parser = argparse.ArgumentParser(
        description='Barcode Scanner - Detect Code128 barcodes from camera or images',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan from live camera
  python barcode_scanner.py --camera
  
  # Scan from image file
  python barcode_scanner.py --image barcodes/SMC1234567.png
  
  # Scan all images in directory
  python barcode_scanner.py --directory barcodes
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--camera', '-c', action='store_true', 
                      help='Scan from live camera')
    group.add_argument('--image', '-i', type=str, 
                      help='Scan from image file')
    group.add_argument('--directory', '-d', type=str, 
                      help='Scan all images in directory')
    
    args = parser.parse_args()
    
    try:
        if args.camera:
            scan_from_camera()
        elif args.image:
            scan_from_image(args.image)
        elif args.directory:
            scan_directory(args.directory)
    except KeyboardInterrupt:
        print("\n\n✓ Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
