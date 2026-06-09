[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType = WindowsRuntime] | Out-Null
$manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetResults()
$session = $manager.GetCurrentSession()
if ($session) {
    Write-Output $session.GetPlaybackInfo().PlaybackStatus.ToString()
} else {
    Write-Output "None"
}
