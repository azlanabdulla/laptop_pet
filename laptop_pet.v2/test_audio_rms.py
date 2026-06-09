import pyaudio
import sys
import numpy as np
import time

try:
    p = pyaudio.PyAudio()
    info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    default_speakers = p.get_device_info_by_index(info["defaultOutputDevice"])
    
    if not default_speakers["isLoopbackDevice"]:
        for loopback in p.get_loopback_device_info_generator():
            if default_speakers["name"] in loopback["name"]:
                default_speakers = loopback
                break
                
    def callback(in_data, frame_count, time_info, status):
        audio_data = np.frombuffer(in_data, dtype=np.int16)
        rms = np.sqrt(np.mean(audio_data.astype(np.float32)**2))
        print(f"RMS: {rms}", flush=True)
        return (in_data, pyaudio.paContinue)

    stream = p.open(format=pyaudio.paInt16,
                    channels=default_speakers["maxInputChannels"],
                    rate=int(default_speakers["defaultSampleRate"]),
                    input=True,
                    input_device_index=default_speakers["index"],
                    stream_callback=callback)

    stream.start_stream()
    time.sleep(2)
    stream.stop_stream()
    stream.close()
    p.terminate()
except Exception as e:
    print(f"Error: {e}")
