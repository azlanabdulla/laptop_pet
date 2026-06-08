import asyncio
from winrt.windows.media.control import GlobalSystemMediaTransportControlsSessionManager

async def check_media():
    manager = await GlobalSystemMediaTransportControlsSessionManager.request_async()
    session = manager.get_current_session()
    if session:
        playback_info = session.get_playback_info()
        print(f"Status: {playback_info.playback_status}")
    else:
        print("No media session")

asyncio.run(check_media())
