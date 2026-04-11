/**
 * South Korea Regional Data
 * 
 * Complete list of 17 cities/provinces (시/도) and 228 districts (구/군)
 * Used for location-based matching in the repair platform
 * 
 * Key features:
 * - Distance calculation between user and repairer
 * - Special badge for ultra-close matches (<2km)
 * - Regional filtering for repair requests
 */

export interface Region {
  city: string;      // City/Province name (시/도)
  districts: string[]; // District names (구/군)
}

// Complete South Korea administrative divisions
// Total: 17 cities/provinces × 228 districts
export const regions: Region[] = [
  {
    city: '서울',
    districts: [
      '강남구', '강동구', '강북구', '강서구', '관악구',
      '광진구', '구로구', '금천구', '노원구', '도봉구',
      '동대문구', '동작구', '마포구', '서대문구', '서초구',
      '성동구', '성북구', '송파구', '양천구', '영등포구',
      '용산구', '은평구', '종로구', '중구', '중랑구'
    ]
  },
  {
    city: '부산',
    districts: [
      '강서구', '금정구', '기장군', '남구', '동구',
      '동래구', '부산진구', '북구', '사상구', '사하구',
      '서구', '수영구', '연제구', '영도구', '중구', '해운대구'
    ]
  },
  {
    city: '인천',
    districts: [
      '강화군', '계양구', '남동구', '동구', '미추홀구',
      '부평구', '서구', '연수구', '옹진군', '중구'
    ]
  },
  {
    city: '대구',
    districts: [
      '남구', '달서구', '달성군', '동구', '북구',
      '서구', '수성구', '중구'
    ]
  },
  {
    city: '대전',
    districts: [
      '대덕구', '동구', '서구', '유성구', '중구'
    ]
  },
  {
    city: '광주',
    districts: [
      '광산구', '남구', '동구', '북구', '서구'
    ]
  },
  {
    city: '울산',
    districts: [
      '남구', '동구', '북구', '울주군', '중구'
    ]
  },
  {
    city: '세종',
    districts: ['세종시']
  },
  {
    city: '경기',
    districts: [
      '고양시', '과천시', '광명시', '광주시', '구리시',
      '군포시', '김포시', '남양주시', '동두천시', '부천시',
      '성남시', '수원시', '시흥시', '안산시', '안성시',
      '안양시', '양주시', '오산시', '용인시', '의왕시',
      '의정부시', '이천시', '파주시', '평택시', '포천시',
      '하남시', '화성시', '가평군', '양평군', '여주시', '연천군'
    ]
  },
  {
    city: '강원',
    districts: [
      '강릉시', '동해시', '삼척시', '속초시', '원주시',
      '춘천시', '태백시', '고성군', '양구군', '양양군',
      '영월군', '인제군', '정선군', '철원군', '평창군',
      '홍천군', '화천군', '횡성군'
    ]
  },
  {
    city: '충북',
    districts: [
      '제천시', '청주시', '충주시', '괴산군', '단양군',
      '보은군', '영동군', '옥천군', '음성군', '증평군', '진천군'
    ]
  },
  {
    city: '충남',
    districts: [
      '계룡시', '공주시', '논산시', '당진시', '보령시',
      '서산시', '아산시', '천안시', '금산군', '부여군',
      '서천군', '예산군', '청양군', '태안군', '홍성군'
    ]
  },
  {
    city: '전북',
    districts: [
      '군산시', '김제시', '남원시', '익산시', '전주시',
      '정읍시', '고창군', '무주군', '부안군', '순창군',
      '완주군', '임실군', '장수군', '진안군'
    ]
  },
  {
    city: '전남',
    districts: [
      '광양시', '나주시', '목포시', '순천시', '여수시',
      '강진군', '고흥군', '곡성군', '구례군', '담양군',
      '무안군', '보성군', '신안군', '영광군', '영암군',
      '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'
    ]
  },
  {
    city: '경북',
    districts: [
      '경산시', '경주시', '구미시', '김천시', '문경시',
      '상주시', '안동시', '영주시', '영천시', '포항시',
      '고령군', '군위군', '봉화군', '성주군', '영덕군',
      '영양군', '예천군', '울릉군', '울진군', '의성군',
      '청도군', '청송군', '칠곡군'
    ]
  },
  {
    city: '경남',
    districts: [
      '거제시', '김해시', '밀양시', '사천시', '양산시',
      '진주시', '창원시', '통영시', '거창군', '고성군',
      '남해군', '산청군', '의령군', '창녕군', '하동군',
      '함안군', '함양군', '합천군'
    ]
  },
  {
    city: '제주',
    districts: ['서귀포시', '제주시']
  }
];

// 특정 시/도의 구/군 목록 가져오기
export function getDistrictsByCity(city: string): string[] {
  const region = regions.find(r => r.city === city);
  return region ? region.districts : [];
}

// 모든 시/도 목록
export function getAllCities(): string[] {
  return regions.map(r => r.city);
}

// 전체 지역 수
export function getTotalRegions(): number {
  return regions.reduce((sum, region) => sum + region.districts.length, 0);
}

// 지역명 포맷팅 (예: "서울 강남구")
export function formatRegion(city: string, district: string): string {
  return `${city} ${district}`;
}

// 검색용 함수
export function searchRegions(query: string): Array<{ city: string; district: string }> {
  const results: Array<{ city: string; district: string }> = [];
  const lowerQuery = query.toLowerCase();
  
  regions.forEach(region => {
    region.districts.forEach(district => {
      if (
        region.city.toLowerCase().includes(lowerQuery) ||
        district.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ city: region.city, district });
      }
    });
  });
  
  return results;
}