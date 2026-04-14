import type { Meetup } from '../app/types';
import { isCareMeetupCategory } from '../app/utils/meetupCategory';
import { meetupVisibleInPublicFeed } from '../app/utils/meetupPublicVisibility';
import { districtMatchesAnyReference } from '../app/utils/districtRefMatch';

export type CareNeedDistrictTabFilterOptions = {
  promoFree: boolean;
  locationBasedEnabled: boolean;
  referenceDistricts: readonly string[];
  viewerUserId: string;
};

/**
 * `/sitters` 맡기는 사람(돌봄) 탭과 동일한 기준:
 * 돌봄 카테고리 · 공개 노출 · 위치 기반 켜짐+기준 동네 있으면 행정구 매칭 · 내 글은 항상 통과
 */
export function filterCareNeedMeetupsForDistrictTab(
  merged: Meetup[],
  opts: CareNeedDistrictTabFilterOptions,
): Meetup[] {
  const passesRegion = (district: string, viewerId: string, userId: string) => {
    if (viewerId !== '' && userId === viewerId) return true;
    if (!opts.locationBasedEnabled) return true;
    if (opts.referenceDistricts.length === 0) return true;
    const d = district?.trim() ?? '';
    if (!d) return false;
    return districtMatchesAnyReference(d, opts.referenceDistricts);
  };

  return merged
    .filter((req) => isCareMeetupCategory(req.category))
    .filter((req) => meetupVisibleInPublicFeed(req, opts.promoFree))
    .filter((req) => passesRegion(req.district ?? '', opts.viewerUserId, req.userId));
}
