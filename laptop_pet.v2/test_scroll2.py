import time
from pynput import mouse
def on_scroll(x,y,dx,dy):
    print("scrolled", dx, dy)
listener = mouse.Listener(on_scroll=on_scroll)
listener.start()
print("ready")
time.sleep(10)
