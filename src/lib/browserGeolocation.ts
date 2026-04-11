export function getCurrentBrowserPosition(): Promise<{ lat: number; lng: number }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('이 환경에서는 위치 정보를 사용할 수 없습니다.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('위치 권한이 거부되었습니다. 브라우저 설정에서 위치를 허용해 주세요.'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error('위치를 확인할 수 없습니다.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('위치 요청 시간이 초과되었습니다.'));
        } else {
          reject(new Error('위치를 가져오지 못했습니다.'));
        }
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );
  });
}
