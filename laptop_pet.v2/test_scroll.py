import time
from pynput import mouse
def on_scroll(x,y,dx,dy):
    print('scrolled', dy, flush=True)

listener = mouse.Listener(on_scroll=on_scroll)
listener.start()
print("ready")
time.sleep(3)
