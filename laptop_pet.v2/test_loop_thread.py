import sys
import time
import asyncio
import threading

try:
    from winrt.windows.media.control import GlobalSystemMediaTransportControlsSessionManager
except ImportError:
    GlobalSystemMediaTransportControlsSessionManager = None

async def check_media_loop():
    if not GlobalSystemMediaTransportControlsSessionManager:
        print("No SMTC")
        return
        
    try:
        manager = await GlobalSystemMediaTransportControlsSessionManager.request_async()
        print("Got manager")
    except Exception as e:
        print(f"Error getting manager: {e}")
        return

def run_async_loop():
    asyncio.run(check_media_loop())

t = threading.Thread(target=run_async_loop, daemon=True)
t.start()
time.sleep(2)
