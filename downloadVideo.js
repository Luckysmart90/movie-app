/* CineBox video saver.
   Android APK: saves permitted direct video URLs into the phone's Gallery, in a CineBox album.
   Website: falls back to the browser's Downloads folder; the source host must allow CORS. */
window.downloadVideoToGallery = async function (url, options) {
  options = options || {};
  const name = options.fileName || decodeURIComponent(new URL(url).pathname.split("/").pop() || "video.mp4");
  const native = !!(window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform());

  if (native) {
    const media = window.Capacitor.Plugins && window.Capacitor.Plugins.Media;
    if (!media || typeof media.saveVideo !== "function") {
      throw new Error("The Android Gallery saver is not loaded. Please rebuild and install the latest CineBox APK.");
    }
    let response = await media.getAlbums();
    let albums = response && Array.isArray(response.albums) ? response.albums : [];
    let album = albums.find(a => (a.name || "").toLowerCase() === "cinebox");
    if (!album) {
      await media.createAlbum({ name: "CineBox" });
      response = await media.getAlbums();
      albums = response && Array.isArray(response.albums) ? response.albums : [];
      album = albums.find(a => (a.name || "").toLowerCase() === "cinebox");
      if (!album && albums.length) album = albums[albums.length - 1];
    }
    if (!album || !album.identifier) {
      throw new Error("CineBox could not access a Gallery album. Please try again after restarting the app.");
    }
    const fileName = name.replace(/\.[^.]+$/, "") || "video";
    await media.saveVideo({ path: url, albumIdentifier: album.identifier, fileName });
    return { fileName: name, location: "Gallery" };
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error("The video server returned HTTP " + response.status + ".");
  const blob = await response.blob();
  if (!blob.size) throw new Error("The video file appears to be empty.");
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
    return { fileName: name, bytes: blob.size, location: "Downloads" };
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }
};