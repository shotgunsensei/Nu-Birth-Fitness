import type { YouTubeVideo } from '../types/youtube';

const CATEGORIES = {
  pregnancy: ['pregnan', 'prenatal', 'bump', 'trimester'],
  postpartum: ['postpartum', 'postnatal', 'recovery', 'rehab'],
  strength: ['strength', 'weights', 'dumbbells', 'core', 'hiit'],
};

export function classifyVideos(videos: YouTubeVideo[]) {
  const pregnancy: YouTubeVideo[] = [];
  const postpartum: YouTubeVideo[] = [];
  const strength: YouTubeVideo[] = [];

  videos.forEach((v) => {
    const text = (v.title + ' ' + v.description).toLowerCase();
    
    let matched = false;
    if (CATEGORIES.pregnancy.some(k => text.includes(k))) {
      pregnancy.push(v);
      matched = true;
    }
    if (CATEGORIES.postpartum.some(k => text.includes(k))) {
      postpartum.push(v);
      matched = true;
    }
    if (CATEGORIES.strength.some(k => text.includes(k))) {
      strength.push(v);
      matched = true;
    }
  });

  return {
    pregnancy: pregnancy.length >= 2 ? pregnancy : [],
    postpartum: postpartum.length >= 2 ? postpartum : [],
    strength: strength.length >= 2 ? strength : [],
  };
}
