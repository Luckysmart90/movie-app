// downloadVideo.js - No-Bundler Native Downloader Wrapper
async function downloadMovieNatively(targetUrl, fileTitle) {
    // 1. Check if the code is running inside a compiled mobile application container
    if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.Filesystem) {
        alert("Gallery storage access requires compiling this framework inside a native Android APK build container.");
        return;
    }

    const { Filesystem, Http, Toast } = Capacitor.Plugins;

    try {
        // 2. Alert the user that the download operation has started
        if (Toast) {
            await Toast.show({ text: `Downloading ${fileTitle} to your photo library...` });
        } else {
            alert(`Starting download for ${fileTitle}...`);
        }
        
        // Clean special characters out of the title to keep the filename format safe
        const safeName = fileTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".mp4";
        
        // 3. Request background network streaming straight to the public user storage landscape
        await Http.downloadFile({
            url: targetUrl,
            filePath: `DCIM/Camera/${safeName}`,
            directory: 'EXTERNAL_STORAGE'
        });

        // 4. Return complete status message to the UI
        if (Toast) {
            await Toast.show({ text: "Success! Video added to system gallery layout." });
        } else {
            alert("Download complete! File saved inside Gallery container.");
        }
    } catch (err) {
        console.error("Native file transfer failure:", err);
        alert("Download execution failed. Please verify source configurations or network configurations.");
    }
}

// Attach to the global web window instance so index.html can trigger it natively
window.downloadMovieNatively = downloadMovieNatively;