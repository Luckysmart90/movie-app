// downloadVideo.js - Corrected Capacitor Downloader Wrapper
async function downloadMovieNatively(targetUrl, fileTitle) {
    // 1. Check if the code is running inside a compiled mobile application container
    if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.Filesystem) {
        alert("Gallery storage access requires compiling this framework inside a native Android APK build container.");
        return;
    }

    const { Filesystem, Http, Toast } = Capacitor.Plugins;

    try {
        // Prevent broken template string code leakage from making real native HTTP calls
        if (!targetUrl || targetUrl.trim() === "" || targetUrl.startsWith("${") || targetUrl.includes("${")) {
            alert("Error: Invalid, unparsed, or corrupt download link.");
            return;
        }

        if (Toast) {
            await Toast.show({ text: `Downloading ${fileTitle || 'Video'} to your library...` });
        }
        
        // Clean special characters out of the title to keep the filename format safe
        const cleanTitle = fileTitle ? fileTitle : "movie_" + Date.now();
        const safeName = cleanTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".mp4";
        
        // Use 'Documents' as the target directory. It has the cleanest operational 
        // read/write runtime stability without causing sandboxed permission crashes on Android.
        await Http.downloadFile({
            url: targetUrl,
            filePath: safeName,
            directory: 'Documents'
        });

        if (Toast) {
            await Toast.show({ text: "Success! Video saved safely to your Documents directory." });
        } else {
            alert("Download complete! File saved successfully.");
        }
    } catch (err) {
        console.error("Native file transfer failure:", err);
        alert("Download execution failed. Please verify source configurations or network configurations.");
    }
}

// Attach to the global web window instance so index.html can trigger it natively
window.downloadMovieNatively = downloadMovieNatively;
