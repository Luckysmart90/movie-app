/* CineBox browser downloader.
   On GitHub Pages this saves to the browser's Downloads folder, not directly to Gallery.
   Cross-origin video hosts must permit CORS for the fetch-based download to work. */
window.downloadVideoToGallery = async function (url, options) {
  options = options || {};
  const response = await fetch(url);
  if (!response.ok) throw new Error("The video server returned HTTP " + response.status + ".");
  const blob = await response.blob();
  if (!blob.size) throw new Error("The video file appears to be empty.");
  const name = options.fileName || decodeURIComponent(new URL(url).pathname.split("/").pop() || "video.mp4");
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (options.onProgress) options.onProgress({ loaded: blob.size, total: blob.size, percent: 100 });
    return { fileName: name, bytes: blob.size };
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }
};