import asyncio
from winrt.windows.media.control import GlobalSystemMediaTransportControlsSessionManager

async def test():
    manager = await GlobalSystemMediaTransportControlsSessionManager.request_async()
    session = manager.get_current_session()
    if session:
        status = session.get_playback_info().playback_status
        print(f"Status value: {status.value}")
        print(f"Status name: {status.name}")

asyncio.run(test())
