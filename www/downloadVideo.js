// downloadVideo.js - Capacitor Downloader Wrapper
async function downloadMovieNatively(targetUrl, fileTitle) {
    if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.Filesystem) {
        alert("Mobile system storage access requires compiling this framework inside a native Android container shell.");
        return;
    }

    const { Http, Toast } = Capacitor.Plugins;

    try {
        if (!targetUrl || targetUrl.trim() === "") {
            alert("Error: Missing target video URL destination.");
            return;
        }

        if (Toast) {
            await Toast.show({ text: `Initializing download for: ${fileTitle}...` });
        }
        
        const safeName = fileTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".mp4";
        
        await Http.downloadFile({
            url: targetUrl,
            filePath: safeName,
            directory: 'Documents'
        });

        if (Toast) {
            await Toast.show({ text: "Success! Video saved to Documents folder." });
        } else {
            alert("Download completed cleanly.");
        }
    } catch (err) {
        console.error("Critical native file pipeline layout breakdown:", err);
        alert("Download task execution failed. Check network or storage configurations.");
    }
}

window.downloadMovieNatively = downloadMovieNatively;
