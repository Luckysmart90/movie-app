(function () {
  const CACHE = 'CACHE';
  const CHUNK_SIZE = 2 * 1024 * 1024;
  const MAX_RETRIES = 3;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function plugins() {
    const P = window.Capacitor && window.Capacitor.Plugins;
    if (!P || !P.Filesystem || !P.Http || !P.Media) {
      throw new Error('Capacitor plugins not found. Run this inside the installed Android app after Capacitor sync.');
    }
    return P;
  }

  function getHeader(headers, name) {
    headers = headers || {};
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
  }

  async function fetchRange(Http, url, start, end, headers) {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await Http.request({
          method: 'GET',
          url,
          headers: Object.assign({}, headers, { Range: 'bytes=' + start + '-' + end }),
          responseType: 'blob'
        });
        if (res.status !== 206 && res.status !== 200) throw new Error('HTTP ' + res.status);
        if (res.status === 200 && start > 0) throw new Error('This server does not support chunked downloads.');
        return res;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_RETRIES) await sleep(800 * attempt);
      }
    }
    throw lastErr;
  }

  async function currentSize(Filesystem, path) {
    try {
      const s = await Filesystem.stat({ path, directory: CACHE });
      return s.size || 0;
    } catch (e) { return 0; }
  }

  async function downloadVideoToGallery(url, opts) {
    opts = opts || {};
    const { Filesystem, Http, Media } = plugins();
    const albumName = opts.albumName || 'CineBox';
    const headers = opts.headers || {};
    const onProgress = opts.onProgress;
    const guessed = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    const fileName = opts.fileName || guessed || 'video_' + Date.now() + '.mp4';
    const tmpPath = 'downloads/' + fileName;

    const probe = await Http.request({
      method: 'GET', url,
      headers: Object.assign({}, headers, { Range: 'bytes=0-0' }),
      responseType: 'blob'
    });
    const contentRange = getHeader(probe.headers, 'Content-Range');
    const total = probe.status === 206 && contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;

    if (probe.status === 206 && total > 0) {
      let loaded = await currentSize(Filesystem, tmpPath);
      if (loaded > total) {
        await Filesystem.deleteFile({ path: tmpPath, directory: CACHE });
        loaded = 0;
      }
      while (loaded < total) {
        const end = Math.min(loaded + CHUNK_SIZE - 1, total - 1);
        const res = await fetchRange(Http, url, loaded, end, headers);
        if (res.status !== 206 && loaded > 0) throw new Error('The server stopped supporting chunked downloads.');
        if (loaded === 0) {
          await Filesystem.writeFile({ path: tmpPath, data: res.data, directory: CACHE, recursive: true });
        } else {
          await Filesystem.appendFile({ path: tmpPath, data: res.data, directory: CACHE });
        }
        loaded = Math.min(end + 1, total);
        if (onProgress) onProgress({ loaded, total, percent: Math.round((loaded / total) * 100) });
      }
    } else {
      await Filesystem.downloadFile({ url, path: tmpPath, directory: CACHE, recursive: true, headers });
      if (onProgress) onProgress({ loaded: 1, total: 1, percent: 100 });
    }

    const { uri } = await Filesystem.getUri({ path: tmpPath, directory: CACHE });
    let albumIdentifier;
    try {
      let res = await Media.getAlbums();
      let album = (res.albums || []).find(a => a.name === albumName);
      if (!album) {
        await Media.createAlbum({ name: albumName });
        res = await Media.getAlbums();
        album = (res.albums || []).find(a => a.name === albumName);
      }
      albumIdentifier = album && album.identifier;
    } catch (e) { console.warn('Album lookup failed; trying default gallery location', e); }

    await Media.saveVideo({ path: uri, albumIdentifier });
    try { await Filesystem.deleteFile({ path: tmpPath, directory: CACHE }); } catch (e) {}
    return { uri, bytes: total || 0 };
  }

  window.downloadVideoToGallery = downloadVideoToGallery;
})();