import time
from pynput import mouse
def on_scroll(x,y,dx,dy):
    pass
listener = mouse.Listener(on_scroll=on_scroll)
listener.start()
print("starting join", flush=True)
listener.join()
print("exited join", flush=True)
