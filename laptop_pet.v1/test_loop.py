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
        
    is_playing = False
    print("Starting loop")
    
    for _ in range(5):
        try:
            session = manager.get_current_session()
            currently_playing = False
            if session:
                playback_info = session.get_playback_info()
                print(f"Current status: {playback_info.playback_status.value}")
                if playback_info.playback_status.value == 4: # 4 = Playing
                    currently_playing = True
            else:
                print("No session")
                    
            if currently_playing != is_playing:
                is_playing = currently_playing
                if is_playing:
                    print("music_start", flush=True)
                else:
                    print("music_stop", flush=True)
        except Exception as e:
            print(f"Exception in loop: {e}")
            pass
            
        await asyncio.sleep(1)

asyncio.run(check_media_loop())
