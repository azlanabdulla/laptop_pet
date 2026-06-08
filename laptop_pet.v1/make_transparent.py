import sys
try:
    from PIL import Image
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    # Tolerance for white background
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print("Success")
except Exception as e:
    print(f"Error: {e}")
    # If PIL not installed, just copy it as is using shutil
    import shutil
    shutil.copy2(sys.argv[1], sys.argv[2])
    print("Copied without transparency because PIL is missing")
