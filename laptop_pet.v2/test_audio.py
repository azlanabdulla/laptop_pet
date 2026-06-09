import pyaudio
import sys

try:
    p = pyaudio.PyAudio()
    info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    default_speakers = p.get_device_info_by_index(info["defaultOutputDevice"])
    print(default_speakers['name'])
except Exception as e:
    print(f"Error: {e}")
