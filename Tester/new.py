import cv2
import os

os.add_dll_directory(r"C:\Users\Huntrs\AppData\Roaming\Python\Python311\site-packages\pyzbar")

from pyzbar.pyzbar import decode
from pyzbar.pyzbar import decode

cap = cv2.VideoCapture(0)

# Medium quality tuning
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Convert to grayscale → faster + stable
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    barcodes = decode(gray)

    for barcode in barcodes:
        x, y, w, h = barcode.rect
        data = barcode.data.decode("utf-8")
        barcode_type = barcode.type

        # Draw box
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # Text
        text = f"{data} ({barcode_type})"
        cv2.putText(frame, text, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)

        print("Detected:", data)

    cv2.imshow("Barcode Scanner", frame)

    if cv2.waitKey(1) == 27:  # ESC to exit
        break

cap.release()
cv2.destroyAllWindows()