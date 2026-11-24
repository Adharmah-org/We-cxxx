import heroManuscriptDesk from '@/src/assets/images/hero_manuscript_desk_1795539960664.jpg';
import coverChupkeSach from '@/src/assets/images/cover_chupke_sach_1795539959724.jpg';
import coverMeechPrashna from '@/src/assets/images/cover_meech_prashna_1795539961235.jpg';
import coverLoveFades from '@/src/assets/images/cover_love_fades_1795539961565.jpg';
import theatreStageMotif from '@/src/assets/images/theatre_stage_motif_1795539961964.jpg';
import type { StaticImageData } from 'next/image';

export const ARCHIVE_IMAGES = {
  heroDesk: heroManuscriptDesk,
  chupkeSach: coverChupkeSach,
  meechPrashna: coverMeechPrashna,
  loveFades: coverLoveFades,
  theatreStage: theatreStageMotif,
};

export function getBookCoverImage(slug: string): StaticImageData {
  if (slug.includes('chupke-chupke-sach')) {
    return coverChupkeSach;
  }
  if (slug.includes('natak')) {
    return theatreStageMotif;
  }
  if (slug.includes('meech-prashna-meech-uttar')) {
    return coverMeechPrashna;
  }
  return coverLoveFades;
}
