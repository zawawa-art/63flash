export function preloadImage(url: string) {
  const img = new Image();
  img.src = url;
}

export function preloadImages(urls: string[]) {
  urls.forEach(preloadImage);
}
